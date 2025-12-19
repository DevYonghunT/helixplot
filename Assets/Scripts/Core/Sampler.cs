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
            double tmin, double tmax, int samples,
            Dictionary<string, Value> initialContext = null)
        {
            var points = new List<SamplePoint>(samples);
            // Use initial context if provided, else empty
            var baseCtx = initialContext != null ? new Dictionary<string, Value>(initialContext) : new Dictionary<string, Value>();

            Definition defX = defs.Find(d => d.Target == "x");
            Definition defY = defs.Find(d => d.Target == "y");
            Definition defZ = defs.Find(d => d.Target == "z");
            Definition defR = defs.Find(d => d.Target == "r");
            Definition defF = defs.Find(d => d.Target == "f");

            for (int i = 0; i < samples; i++)
            {
                double u = (double)i / (samples - 1);
                double t = tmin + u * (tmax - tmin);
                
                // Copy base context for this sample (shallow copy is enough for Value types)
                var ctx = new Dictionary<string, Value>(baseCtx);
                // Inject t
                ctx["t"] = Value.FromDouble(t);
                
                // Note: We skip re-evaluating 0-param definitions here, assuming they are in initialContext.
                // If a definition depends on 't' but has 0 params (impossible by parser logic if params are explicit),
                // or if it implicitly uses 't' in body without params signature...
                // Our parser likely puts 't' in params if used? Or maybe not.
                // The previous code re-evaluated ALL 0-param definitions.
                // If "f() = t", it has 0 params but depends on t.
                // WE MUST CHECK if body uses 't'.
                // Ideally, definitions dependent on 't' should declare it: "f(t) = ...".
                // If user writes "y = t", parser might treat it as 0-param def if it looks for explicit "y(t)".
                // Re-evaluating ALL definitions that are NOT in context might be safer?
                // For now, following plan: explicit constants passed in.
                // Any dynamic defs should be handled by 1-param logic or explicit calls.
                // Let's stick to the plan: optimize by using baseCtx.

                var ev = new Evaluator(ctx);
                Vector3 pos = Vector3.zero;
                bool valid = true;

                try
                {
                    if (mode == PlotMode.ParamCurve)
                    {
                        if (defR != null)
                        {
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
                        // Mapping C: re, im, magnitude
                        else if (mapping == ComplexMapping.C)
                        {
                             pos.x = (float)val.Real;
                             pos.y = (float)val.Imag;
                             pos.z = (float)val.Magnitude;
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
