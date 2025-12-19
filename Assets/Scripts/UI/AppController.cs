using UnityEngine;
using UnityEngine.UI;

public class AppController : MonoBehaviour
{
    public GraphManager Graph;
    public InputField CodeInput;
    public Slider TimeSlider;
    public Text ErrorText;
    
    // UI events
    public void OnPlayToggle(bool isOn)
    {
        Graph.SetPlay(isOn);
    }
    
    public void OnRebuild()
    {
        Graph.SetInput(CodeInput.text);
    }
    
    public void OnSliderChanged(float val)
    {
        // Bind slider to Graph Time? 
        // Note: GraphManager handles time internally 0..1 loop.
        // If we want scrubber, we need bidirectional binding.
        // For MVP, slider just visualizes progress or sets it?
        // Let's say Set.
        // Graph._u = val; // Access required
    }
    
    void Update()
    {
        // Poll error? Or event based.
    }
}
