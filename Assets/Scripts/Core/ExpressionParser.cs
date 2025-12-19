using System;
using System.Collections.Generic;
using System.Globalization;
using System.Text.RegularExpressions;

namespace Helixplot.Core
{
    // AST Nodes
    public abstract class ASTNode { }
    
    public class NumberNode : ASTNode
    {
        public double Value;
        public NumberNode(double v) { Value = v; }
    }

    public class VariableNode : ASTNode
    {
        public string Name;
        public VariableNode(string n) { Name = n; }
    }

    public class BinaryOpNode : ASTNode
    {
        public ASTNode Left, Right;
        public string Op;
        public BinaryOpNode(ASTNode l, string op, ASTNode r) { Left = l; Op = op; Right = r; }
    }

    public class UnaryOpNode : ASTNode
    {
        public ASTNode Right;
        public string Op; // "-" or "+"
        public UnaryOpNode(string op, ASTNode r) { Op = op; Right = r; }
    }

    public class FunctionNode : ASTNode
    {
        public string Name;
        public List<ASTNode> Args;
        public FunctionNode(string n, List<ASTNode> args) { Name = n; Args = args; }
    }

    public class TupleNode : ASTNode
    {
        public List<ASTNode> Elements;
        public TupleNode(List<ASTNode> els) { Elements = els; }
    }

    // Definition AST
    public class Definition
    {
        public string Target; // e.g. "x" or "f"
        public List<string> Params; // e.g. ["t"]
        public ASTNode Body;
    }

    public class Parser
    {
        private List<string> _tokens;
        private int _pos;

        public static Definition ParseDefinition(string line)
        {
            // Format: name(args,...) = expr  OR  name = expr
            int eqIndex = line.IndexOf('=');
            if (eqIndex == -1) throw new Exception("Missing '=' in definition");

            string lhs = line.Substring(0, eqIndex).Trim();
            string rhs = line.Substring(eqIndex + 1).Trim();

            var def = new Definition();
            def.Params = new List<string>();

            // Parse LHS
            var match = Regex.Match(lhs, @"^([A-Za-z_][A-Za-z0-9_]*)(?:\(([^)]+)\))?$");
            if (!match.Success) throw new Exception("Invalid left-hand side");
            
            def.Target = match.Groups[1].Value;
            if (match.Groups[2].Success)
            {
                var args = match.Groups[2].Value.Split(',');
                foreach (var a in args) def.Params.Add(a.Trim());
            }

            // Parse RHS
            var tokens = Tokenize(rhs);
            var parser = new Parser(tokens);
            def.Body = parser.ParseExpression();
            
            if (parser._pos < tokens.Count) throw new Exception($"Unexpected token at end: {tokens[parser._pos]}");

            return def;
        }

        public static List<string> Tokenize(string text)
        {
            var tokens = new List<string>();
            int i = 0;
            while (i < text.Length)
            {
                char c = text[i];
                if (char.IsWhiteSpace(c)) { i++; continue; }

                if (char.IsDigit(c) || c == '.')
                {
                    // Number (simple) - improved regex needed for sci notation 2e-3
                    // Quick manual scan
                    int start = i;
                    bool hasDot = false;
                    bool hasE = false;
                    while (i < text.Length)
                    {
                        char n = text[i];
                        if (char.IsDigit(n)) { i++; }
                        else if (n == '.' && !hasDot) { hasDot = true; i++; }
                        else if ((n == 'e' || n == 'E') && !hasE) 
                        { 
                            hasE = true; i++; 
                            if (i < text.Length && (text[i] == '+' || text[i] == '-')) i++;
                        }
                        else break;
                    }
                    tokens.Add(text.Substring(start, i - start));
                }
                else if (char.IsLetter(c) || c == '_')
                {
                    int start = i;
                    while (i < text.Length && (char.IsLetterOrDigit(text[i]) || text[i] == '_')) i++;
                    tokens.Add(text.Substring(start, i - start));
                }
                else
                {
                    // Operator
                    tokens.Add(c.ToString());
                    i++;
                }
            }
            return tokens;
        }

        private Parser(List<string> tokens)
        {
            _tokens = tokens;
            _pos = 0;
        }

        // Grammar:
        // Expr -> Term { (+|-) Term }
        // Term -> Factor { (*|/) Factor }
        // Factor -> Power { ^ Power }  (Right Associative check needed, usually ^ is right assoc)
        // Power -> Unary
        // Unary -> (+|-) Unary | Primary
        // Primary -> Number | Identifier | Identifier(args) | (Expr) | Tuple

        private ASTNode ParseExpression()
        {
            var left = ParseTerm();
            while (_pos < _tokens.Count && (_tokens[_pos] == "+" || _tokens[_pos] == "-"))
            {
                string op = _tokens[_pos++];
                var right = ParseTerm();
                left = new BinaryOpNode(left, op, right);
            }
            return left;
        }

        private ASTNode ParseTerm()
        {
            var left = ParseFactor();
            while (_pos < _tokens.Count && (_tokens[_pos] == "*" || _tokens[_pos] == "/"))
            {
                string op = _tokens[_pos++];
                var right = ParseFactor();
                left = new BinaryOpNode(left, op, right);
            }
            return left;
        }

        private ASTNode ParseFactor()
        {
             // Exponentiation (Right Associative) -> a^b^c = a^(b^c)
             var left = ParseUnary();
             if (_pos < _tokens.Count && _tokens[_pos] == "^")
             {
                 string op = _tokens[_pos++];
                 var right = ParseFactor(); // Recurse for right associativity
                 return new BinaryOpNode(left, op, right);
             }
             return left;
        }
        
        private ASTNode ParseUnary()
        {
            if (_pos < _tokens.Count && (_tokens[_pos] == "+" || _tokens[_pos] == "-"))
            {
                string op = _tokens[_pos++];
                var right = ParseUnary();
                return new UnaryOpNode(op, right);
            }
            return ParsePrimary();
        }

        private ASTNode ParsePrimary()
        {
            if (_pos >= _tokens.Count) throw new Exception("Unexpected end of expression");
            
            string t = _tokens[_pos++];

            // Number
            if (char.IsDigit(t[0]) || t[0] == '.')
            {
                if (double.TryParse(t, NumberStyles.Any, CultureInfo.InvariantCulture, out double val))
                    return new NumberNode(val);
                throw new Exception($"Invalid number: {t}");
            }

            // Grouping or Tuple: ( expr, ... )
            if (t == "(")
            {
                // We parse expressions separated by commmas
                var exprs = new List<ASTNode>();
                exprs.Add(ParseExpression());
                
                while (_pos < _tokens.Count && _tokens[_pos] == ",")
                {
                    _pos++;
                    exprs.Add(ParseExpression());
                }

                if (_pos >= _tokens.Count || _tokens[_pos] != ")") 
                    throw new Exception("Missing ')'");
                _pos++;

                if (exprs.Count == 1) return exprs[0]; // Just parentheses
                return new TupleNode(exprs); // Tuple
            }

            // Identifier or Function Call
            if (char.IsLetter(t[0]) || t[0] == '_')
            {
                // Check if next is '('
                if (_pos < _tokens.Count && _tokens[_pos] == "(")
                {
                    _pos++; // Eat '('
                    var args = new List<ASTNode>();
                    if (_tokens[_pos] != ")")
                    {
                        args.Add(ParseExpression());
                        while (_pos < _tokens.Count && _tokens[_pos] == ",")
                        {
                            _pos++;
                            args.Add(ParseExpression());
                        }
                    }
                    if (_pos >= _tokens.Count || _tokens[_pos] != ")") 
                        throw new Exception("Missing ')' in call");
                    _pos++;
                    return new FunctionNode(t, args);
                }
                return new VariableNode(t);
            }

            throw new Exception($"Unexpected token: {t}");
        }
    }
}
