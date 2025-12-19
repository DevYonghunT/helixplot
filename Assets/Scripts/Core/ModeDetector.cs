using System.Collections.Generic;

namespace Helixplot.Core
{
    public enum PlotMode { Auto, ParamCurve, ComplexCurve, Surface }
    
    public enum ComplexMapping { A, B, C } 
    // A: (t, re, im), B: (re, im, t), C: (re, im, abs)

    public class ModeDetector
    {
        public static PlotMode Detect(List<Definition> defs, PlotMode forcedMode = PlotMode.Auto)
        {
            if (forcedMode != PlotMode.Auto) return forcedMode;

            bool hasX = false, hasY = false, hasZ = false;
            bool hasR = false;
            bool hasF = false;
            bool hasSurfaceZ = false; // z(x,y)

            foreach (var d in defs)
            {
                if (d.Target == "x") hasX = true;
                if (d.Target == "y") hasY = true;
                if (d.Target == "z")
                {
                    hasZ = true;
                     // Surface check: if params are x,y
                    if (d.Params.Contains("x") && d.Params.Contains("y")) hasSurfaceZ = true;
                }
                if (d.Target == "r") hasR = true; // vector r(t)
                if (d.Target == "f") hasF = true;
            }

            if (hasR) return PlotMode.ParamCurve;
            if (hasX && hasY && hasZ) return PlotMode.ParamCurve;
            if (hasF) return PlotMode.ComplexCurve;
            if (hasSurfaceZ) return PlotMode.Surface;
            
            // Fallback: If only z=... and it contains x,y in expression? 
            // Parsing expression for free variables is complex without walking AST details.
            // MVP rule 4) said x,y included in free vars.
            // But we check definitions target.
            
            return PlotMode.ParamCurve; // Default or Error?
        }
    }
}
