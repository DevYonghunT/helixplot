using System.Collections.Generic;

namespace Helixplot.Core
{
    public class Preset
    {
        public string Name;
        public string Code;
        public PlotMode ExpectedMode;
    }

    public static class PresetLibrary
    {
        public static List<Preset> Presets = new List<Preset>()
        {
            new Preset 
            {
                Name = "Complex Lissajous",
                Code = "f(t)=exp(-0.2*(t-5)^2) * (cos(6*t) + i*sin(6*t))\ntmin=0\ntmax=10",
                ExpectedMode = PlotMode.ComplexCurve
            },
            new Preset 
            {
                Name = "3D Helix",
                Code = "x(t)=cos(t)\ny(t)=sin(t)\nz(t)=0.1*t\ntmin=0\ntmax=62.8", // 20*pi approximated
                ExpectedMode = PlotMode.ParamCurve
            },
            new Preset 
            {
                Name = "Surface Ripple",
                Code = "z=sin(x)*cos(y)\nxmin=-3.14\nxmax=3.14\nymin=-3.14\nymax=3.14",
                ExpectedMode = PlotMode.Surface
            },
            new Preset 
            {
                Name = "NaN Discontinuity",
                Code = "x(t)=1/(t-1)\ny(t)=sin(t)\nz(t)=0\ntmin=0\ntmax=2",
                ExpectedMode = PlotMode.ParamCurve
            }
        };
    }
}
