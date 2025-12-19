using UnityEngine;
using System.Collections.Generic;
using Helixplot.Core;

public class GraphManager : MonoBehaviour
{
    // Configuration
    public int Samples = 500;
    public float TMin = 0;
    public float TMax = 10;
    public string InputCode;

    // References
    public CurveRenderer MainRenderer;
    public CurveRenderer[] ProjectionRenderers; // XY, XZ, YZ
    
    // State
    private List<Definition> _defs;
    private PlotMode _currentMode;
    private List<SamplePoint> _data;
    private bool _isPlaying = false;
    private float _playSpeed = 1.0f;
    private float _u = 0; // Normalized time 0..1

    void Start()
    {
        // Initial Test Case
        InputCode = "f(t) = exp(-0.1*t) * (cos(5*t) + i*sin(5*t))\ntmin=0\ntmax=10";
        Rebuild();
    }

    public void Rebuild()
    {
        try 
        {
            // 1. Parse
            var lines = InputCode.Split('\n');
            _defs = new List<Definition>();
            foreach (var line in lines)
            {
                if (string.IsNullOrWhiteSpace(line) || line.Trim().StartsWith("#") || line.Trim().StartsWith("//")) continue;
                _defs.Add(Parser.ParseDefinition(line));
            }

            // 2. Detect Mode
            _currentMode = ModeDetector.Detect(_defs);

            // 3. Extract Ranges (naive)
            // Ideally Sampler extracts constants first.
            // For MVP we can just manually check definitions or assume tmin/tmax vars exist
            // Or just hardcode defaults if not found.

            // 4. Sample
            _data = Sampler.SampleCurve(_defs, _currentMode, ComplexMapping.A, TMin, TMax, Samples);

            // 5. Render
            UpdateVisuals();
        }
        catch (System.Exception e)
        {
            Debug.LogError($"Graph Error: {e.Message}");
        }
    }

    void Update()
    {
        if (_isPlaying && _data != null && _data.Count > 1)
        {
            float duration = (TMax - TMin);
            if (duration <= 0) duration = 10f;
            
            _u += (Time.deltaTime * _playSpeed) / duration;
            if (_u > 1f) _u %= 1f;

            UpdateCursor();
        }
    }

    void UpdateVisuals()
    {
        if (_data == null) return;
        
        // Push data to renderers
        MainRenderer.Draw(_data);
        foreach(var proj in ProjectionRenderers) proj.Draw(_data);
        
        UpdateCursor();
    }

    void UpdateCursor()
    {
        // Calculate Index
        int idx = Mathf.FloorToInt(_u * (_data.Count - 1));
        idx = Mathf.Clamp(idx, 0, _data.Count - 1);
        
        // Update Cursor Position
        if (_data[idx].IsValid)
        {
            Vector3 pos = _data[idx].Position;
            MainRenderer.SetCursor(pos);
            // Projections would project pos to 2D
        }
    }
    
    public void SetInput(string code) { InputCode = code; Rebuild(); }
    public void SetPlay(bool play) { _isPlaying = play; }
}
