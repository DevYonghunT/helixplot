using System;
using System.Collections.Generic;

namespace Helixplot.Core
{
    public class Evaluator
    {
        private Dictionary<string, Value> _context;

        public Evaluator(Dictionary<string, Value> context)
        {
            _context = context;
            // Ensure constants
            if (!_context.ContainsKey("pi")) _context["pi"] = Value.FromDouble(Math.PI);
            if (!_context.ContainsKey("e")) _context["e"] = Value.FromDouble(Math.E);
            if (!_context.ContainsKey("tau")) _context["tau"] = Value.FromDouble(2 * Math.PI);
            if (!_context.ContainsKey("i")) _context["i"] = Value.FromComplex(new Complex(0, 1));
            if (!_context.ContainsKey("j")) _context["j"] = Value.FromComplex(new Complex(0, 1));
        }

        public Value Evaluate(ASTNode node)
        {
            switch (node)
            {
                case NumberNode n: 
                    return Value.FromDouble(n.Value);
                
                case VariableNode v:
                    if (_context.TryGetValue(v.Name, out var val)) return val;
                    throw new Exception($"Undefined variable: {v.Name}");
                
                case BinaryOpNode b:
                    Value l = Evaluate(b.Left);
                    Value r = Evaluate(b.Right);
                    return EvaluateBinary(l, b.Op, r);

                case UnaryOpNode u:
                    Value vRight = Evaluate(u.Right);
                    return EvaluateUnary(u.Op, vRight);

                case FunctionNode f:
                    var args = new List<Value>();
                    foreach (var a in f.Args) args.Add(Evaluate(a));
                    return EvaluateFunction(f.Name, args);
                    
                case TupleNode t:
                    throw new Exception("Tuples cannot be evaluated to a single Value (Evaluator only handles scaler/complex flow internally)"); 
                    // Note: Tuple support usually for r(t)=(x,y,z). 
                    // We handle that in Sampler by evaluating children separately, or better:
                    // Here we can return a "TupleValue" if we expanded Value type, but MVP spec says r(t) is special.
                    // Let's throw for now or handle inside Sampler.
                    // Actually, definition parsing handles r(t).
            }
            throw new Exception("Unknown node type");
        }

        private Value EvaluateBinary(Value a, string op, Value b)
        {
            bool isComplex = a.IsComplex || b.IsComplex;
            if (!isComplex)
            {
                // Double path
                switch (op)
                {
                    case "+": return Value.FromDouble(a.Real + b.Real);
                    case "-": return Value.FromDouble(a.Real - b.Real);
                    case "*": return Value.FromDouble(a.Real * b.Real);
                    case "/": return Value.FromDouble(a.Real / b.Real);
                    case "^": return Value.FromDouble(Math.Pow(a.Real, b.Real));
                }
            }
            else
            {
                // Complex path
                Complex ca = a.IsComplex ? a.ToComplex() : new Complex(a.Real, 0);
                Complex cb = b.IsComplex ? b.ToComplex() : new Complex(b.Real, 0);
                
                switch (op)
                {
                    case "+": return Value.FromComplex(ca + cb);
                    case "-": return Value.FromComplex(ca - cb);
                    case "*": return Value.FromComplex(ca * cb);
                    case "/": return Value.FromComplex(ca / cb);
                    case "^": 
                        // Complex Power: a^b = exp(b * log(a))
                        double r = ca.Magnitude;
                        double phi = ca.Phase;
                        // log(a) = ln(r) + i*phi
                        Complex lnA = new Complex(Math.Log(r), phi);
                        // b * lnA
                        Complex exp = cb * lnA;
                        // exp(z) -> e^x * (cos y + i sin y)
                        double ex = Math.Exp(exp.Real);
                        return Value.FromComplex(new Complex(ex * Math.Cos(exp.Imag), ex * Math.Sin(exp.Imag)));
                }
            }
            throw new Exception($"Unknown operator {op}");
        }

        private Value EvaluateUnary(string op, Value v)
        {
            if (op == "-")
            {
                if (v.IsComplex) return Value.FromComplex(-v.ToComplex());
                return Value.FromDouble(-v.Real);
            }
            // op == "+"
            return v; 
        }

        private Value EvaluateFunction(string name, List<Value> args)
        {
            if (args.Count == 0) throw new Exception("No args");
            Value v = args[0];
            
            // Helper to check Arg count
            void CheckArgs(int count) { if (args.Count != count) throw new Exception($"{name} expects {count} args"); }

            // Strict Integer Checks - Throw on Complex
            if (name == "floor" || name == "ceil" || name == "round" || name == "mod")
            {
                if (args.Exists(a => a.IsComplex)) throw new Exception($"DomainError: Function '{name}' does not support Complex inputs.");
            }

            // --- Double Functions ---
            // If input is Complex, some support it (sin/cos/exp), others don't (floor).
            // MVP Rule: "If safe to promote, do it. If integer-like, error."
            
            bool anyComplex = args.Exists(a => a.IsComplex);

            if (!anyComplex)
            {
                double x = v.Real;
                switch (name)
                {
                    case "sin": return Value.FromDouble(Math.Sin(x));
                    case "cos": return Value.FromDouble(Math.Cos(x));
                    case "tan": return Value.FromDouble(Math.Tan(x));
                    case "asin": return Value.FromDouble(Math.Asin(x));
                    case "acos": return Value.FromDouble(Math.Acos(x));
                    case "atan": return Value.FromDouble(Math.Atan(x));
                    case "exp": return Value.FromDouble(Math.Exp(x));
                    case "log": 
                    case "ln": return Value.FromDouble(Math.Log(x));
                    case "log10": return Value.FromDouble(Math.Log10(x));
                    case "sqrt": 
                        if (x < 0) return Value.FromComplex(new Complex(0, Math.Sqrt(-x))); // Auto-promote sqrt(-1)
                        return Value.FromDouble(Math.Sqrt(x));
                    case "abs": return Value.FromDouble(Math.Abs(x));
                    case "sign": return Value.FromDouble(Math.Sign(x));
                    case "floor": return Value.FromDouble(Math.Floor(x));
                    case "ceil": return Value.FromDouble(Math.Ceiling(x));
                    case "round": return Value.FromDouble(Math.Round(x));
                    
                    case "min": CheckArgs(2); return Value.FromDouble(Math.Min(args[0].Real, args[1].Real));
                    case "max": CheckArgs(2); return Value.FromDouble(Math.Max(args[0].Real, args[1].Real));
                    case "clamp": CheckArgs(3); return Value.FromDouble(Math.Clamp(args[0].Real, args[1].Real, args[2].Real));
                    case "mod": CheckArgs(2); return Value.FromDouble(args[0].Real % args[1].Real);
                    
                    // Complex specific getters on reals
                    case "re": return Value.FromDouble(x);
                    case "im": return Value.FromDouble(0);
                    case "arg": return Value.FromDouble(x >= 0 ? 0 : Math.PI);
                    case "conj": return Value.FromDouble(x);
                }
            }
            else
            {
                // Simple Complex Functions
                Complex z = v.ToComplex();
                switch (name)
                {
                    case "sin": 
                        // sin(x+iy) = sin(x)cosh(y) + i cos(x)sinh(y)
                        return Value.FromComplex(new Complex(Math.Sin(z.Real)*Math.Cosh(z.Imag), Math.Cos(z.Real)*Math.Sinh(z.Imag)));
                    case "cos":
                        // cos(x+iy) = cos(x)cosh(y) - i sin(x)sinh(y)
                        return Value.FromComplex(new Complex(Math.Cos(z.Real)*Math.Cosh(z.Imag), -Math.Sin(z.Real)*Math.Sinh(z.Imag)));
                    case "exp":
                        double ex = Math.Exp(z.Real);
                        return Value.FromComplex(new Complex(ex * Math.Cos(z.Imag), ex * Math.Sin(z.Imag)));
                    case "abs": return Value.FromDouble(z.Magnitude);
                    case "re": return Value.FromDouble(z.Real);
                    case "im": return Value.FromDouble(z.Imag);
                    case "conj": return Value.FromComplex(new Complex(z.Real, -z.Imag));
                }
            }

            throw new Exception($"Unknown or duplicate function: {name}");
        }
    }
}
