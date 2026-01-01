using UnityEngine;
using System.Collections.Generic;
using Helixplot.Core;

// NOTE: This script is intended to be run in Editor or attached to a GO to print results to Console.
public class TestRunner : MonoBehaviour
{
    void Start()
    {
        RunValidation();
    }

    [ContextMenu("Run Validation")]
    public void RunValidation()
    {
        Debug.Log("=== Starting Helixplot Validation ===");

        // Test 1: Complex
        string code1 = "f(t)=exp(-0.2*(t-5)^2) * (cos(6*t) + i*sin(6*t))\ntmin=0\ntmax=10";
        Validate("Complex Preset", code1, PlotMode.ComplexCurve, 100);

        // Test 2: Helix
        string code2 = "x(t)=cos(t)\ny(t)=sin(t)\nz(t)=0.1*t\ntmin=0\ntmax=20*pi"; // 20*pi ~ 62.8
        Validate("Helix Preset", code2, PlotMode.ParamCurve, 100);

        // Test 3: Surface (Mock Mode mostly, verifying detection)
        string code3 = "z=sin(x)*cos(y)\nxmin=-pi\nxmax=pi\nymin=-pi\nymax=pi";
        Validate("Surface Preset", code3, PlotMode.Surface, 10, true);

        // Test 4: NaN break
        string code4 = "x(t)=1/(t-1)\ny(t)=sin(t)\nz(t)=0\ntmin=0\ntmax=2";
        Validate("NaN Break", code4, PlotMode.ParamCurve, 100);

        // Test 5: Error Check
        string code5 = "f(t)=floor(i)";
        Validate("Complex Floor Error", code5, PlotMode.Auto, 10, false, true); // Expect Error
        
        Debug.Log("=== Validation Complete ===");
    }

    void Validate(string name, string code, PlotMode expectedMode, int samples, bool surface=false, bool expectError=false)
    {
        Debug.Log($"--- Testing {name} ---");
        try
        {
            var lines = code.Split('\n');
            var defs = new List<Definition>();
            foreach (var line in lines)
            {
                if(string.IsNullOrWhiteSpace(line)) continue;
                defs.Add(Parser.ParseDefinition(line));
            }

            var mode = ModeDetector.Detect(defs);
            if (mode != expectedMode && expectedMode != PlotMode.Auto)
            {
                Debug.LogError($"[FAIL] Mode mismatch. Got {mode}, Expected {expectedMode}");
                return;
            }
            Debug.Log($"[PASS] Mode Detected: {mode}");

            // Sample
            if (!surface)
            {
                var points = Sampler.SampleCurve(defs, mode, ComplexMapping.A, 0, 10, samples);
                if (points.Count == samples) Debug.Log($"[PASS] Sampled {points.Count} points");
                else Debug.LogWarning($"[WARN] Sample count mismatch? {points.Count}/{samples}");

                // Check Specific Logic
                if (name == "NaN Break")
                {
                    // Check near t=1 (middle of 0..2)
                    // If samples=100, t=1 is at index ~50.
                    // 1/(1-1) = Inf.
                    int invalidCount = 0;
                    foreach(var p in points) if(!p.IsValid) invalidCount++;
                    if (invalidCount > 0) Debug.Log($"[PASS] Found {invalidCount} invalid points (NaN/Inf correctly flagged)");
                    else Debug.LogError("[FAIL] No invalid points found in 1/(t-1)");
                }
            }
            
            if (expectError)
            {
                 Debug.LogError($"[FAIL] Expected error but succeeded.");
            }
        }
        catch (System.Exception e)
        {
            if (expectError) Debug.Log($"[PASS] Expected Error Caught: {e.Message}");
            else Debug.LogError($"[FAIL] Exception: {e.Message}");
        }
    }
}
