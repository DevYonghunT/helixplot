using UnityEngine;
using System.Collections.Generic;
using Helixplot.Core;

public class CurveRenderer : MonoBehaviour
{
    public GameObject SegmentPrefab; // Must have LineRenderer component
    public Transform CursorObj;      // Sphere
    
    private List<LineRenderer> _segments = new List<LineRenderer>();

    public void Draw(List<SamplePoint> data)
    {
        if (data == null || data.Count == 0) return;

        // Group into continuous segments
        List<List<Vector3>> segmentPoints = new List<List<Vector3>>();
        List<Vector3> currentSegment = new List<Vector3>();

        foreach (var p in data)
        {
            if (p.IsValid)
            {
                currentSegment.Add(p.Position);
            }
            else
            {
                if (currentSegment.Count > 1) segmentPoints.Add(currentSegment);
                currentSegment = new List<Vector3>();
            }
        }
        if (currentSegment.Count > 1) segmentPoints.Add(currentSegment);

        // Pool Management
        int needed = segmentPoints.Count;
        while (_segments.Count < needed)
        {
            var go = Instantiate(SegmentPrefab, transform);
            _segments.Add(go.GetComponent<LineRenderer>());
        }

        // Draw
        for (int i = 0; i < _segments.Count; i++)
        {
            if (i < needed)
            {
                _segments[i].gameObject.SetActive(true);
                _segments[i].positionCount = segmentPoints[i].Count;
                _segments[i].SetPositions(segmentPoints[i].ToArray());
            }
            else
            {
                _segments[i].gameObject.SetActive(false);
            }
        }
    }
    
    public void SetCursor(Vector3 pos)
    {
        if (CursorObj) CursorObj.position = pos;
    }
}
