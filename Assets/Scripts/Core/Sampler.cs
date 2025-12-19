using System;
using System.Collections.Generic;
using UnityEngine; // For Vector3

namespace Helixplot.Core
{
    public struct SamplePoint
    {
        public Vector3 Position;
        public bool IsValid; // False if NaN/Inf
    }

    public class Sampler
    {
        public static List<SamplePoint> SampleCurve(
            List<Definition> defs, 
            PlotMode mode,
            ComplexMapping mapping,
            double tmin, double tmax, int samples)
        {
            var points = new List<SamplePoint>(samples);
            var evaluator = new Evaluator(new Dictionary<string, Value>());
            
            // 1. Process Constants (a=1, etc)
            // Naive approach: evaluate all definitions with empty context first.
            // If they depend on t, they fail. If constant, they succeed.
            foreach (var d in defs)
            {
                if (d.Params.Count == 0)
                {
                    try {
                        evaluator = new Evaluator(new Dictionary<string, Value>()); // Reset? No use accumulated context
                        // Actually we need a persistent context for constants.
                        // Let's assume constants are evaluated in order or require dependency check.
                        // MVP: Just try to eval everything 0-param.
                    } catch {}
                }
            }
            
            // Better: Context is passed in loop.
            // We need to identify the "Function" definitions.
            
            Definition defX = defs.Find(d => d.Target == "x");
            Definition defY = defs.Find(d => d.Target == "y");
            Definition defZ = defs.Find(d => d.Target == "z");
            Definition defR = defs.Find(d => d.Target == "r");
            Definition defF = defs.Find(d => d.Target == "f");

            for (int i = 0; i < samples; i++)
            {
                double u = (double)i / (samples - 1);
                double t = tmin + u * (tmax - tmin);
                
                var ctx = new Dictionary<string, Value>();
                // Inject t
                ctx["t"] = Value.FromDouble(t);
                
                // Eval constants (inefficient inside loop, but robust)
                foreach(var d in defs) {
                    if(d.Params.Count == 0) {
                        try { ctx[d.Target] = new Evaluator(ctx).Evaluate(d.Body); } catch {}
                    }
                }

                var ev = new Evaluator(ctx);
                Vector3 pos = Vector3.zero;
                bool valid = true;

                try
                {
                    if (mode == PlotMode.ParamCurve)
                    {
                        if (defR != null)
                        {
                            // r(t) = (x,y,z) is a TupleNode.
                            // Evaluator throws on Tuple.
                            // We need to special handle TupleNode body here or implement Tuple support in Evaluator.
                            // Let's peek AST.
                            if (defR.Body is TupleNode tuple && tuple.Elements.Count >= 3)
                            {
                                 Value vx = ev.Evaluate(tuple.Elements[0]);
                                 Value vy = ev.Evaluate(tuple.Elements[1]);
                                 Value vz = ev.Evaluate(tuple.Elements[2]);
                                 pos = new Vector3((float)vx.Real, (float)vy.Real, (float)vz.Real);
                            }
                        }
                        else
                        {
                            if (defX != null) pos.x = (float)ev.Evaluate(defX.Body).Real;
                            if (defY != null) pos.y = (float)ev.Evaluate(defY.Body).Real;
                            if (defZ != null) pos.z = (float)ev.Evaluate(defZ.Body).Real;
                        }
                    }
                    else if (mode == PlotMode.ComplexCurve && defF != null)
                    {
                        Value val = ev.Evaluate(defF.Body);
                        // Default Mapping A: t, re, im
                        if (mapping == ComplexMapping.A)
                        {
                            pos.x = (float)t;
                            pos.y = (float)val.Real;
                            pos.z = (float)val.Imag;
                        }
                        // Mapping B: re, im, t
                        else if (mapping == ComplexMapping.B)
                        {
                             pos.x = (float)val.Real;
                             pos.y = (float)val.Imag;
                             pos.z = (float)t;
                        }
                    }
                }
                catch (Exception)
                {
                    valid = false;
                }

                // Check NaNs
                if (float.IsNaN(pos.x) || float.IsNaN(pos.y) || float.IsNaN(pos.z) || 
                    float.IsInfinity(pos.x) || float.IsInfinity(pos.y) || float.IsInfinity(pos.z))
                {
                    valid = false;
                }

                points.Add(new SamplePoint { Position = pos, IsValid = valid });
            }

            return points;
        }
    }
}
