import { useMemo, useRef, useState, useCallback } from "react";

export type PlaybackRuntime = {
    tRef: React.MutableRefObject<number>;
    playingRef: React.MutableRefObject<boolean>;
    speedRef: React.MutableRefObject<number>;
    loopTRef: React.MutableRefObject<number | null>;
    // UI Display (Throttled update)
    ui: { t: number; progress01: number };
    setPlaying: (v: boolean) => void;
    setSpeed: (v: number) => void;
    setLoopT: (v: number | null) => void;
    seek01: (p: number, tmin: number, tmax: number) => void;
    step: (deltaSec: number, tmin: number, tmax: number) => void;
};

export function usePlaybackRuntime(): PlaybackRuntime {
    const tRef = useRef(0);
    const playingRef = useRef(false);
    const speedRef = useRef(1);
    const loopTRef = useRef<number | null>(null);

    const [ui, setUi] = useState({ t: 0, progress01: 0 });

    // Update UI at ~10fps
    const lastUiUpdateRef = useRef(0);

    const setPlaying = useCallback((v: boolean) => {
        playingRef.current = v;
        // Force UI update immediately on pause/play to reflect state if needed
        // But strictly UI t is updated in loop or seek.
    }, []);

    const setSpeed = useCallback((v: number) => {
        speedRef.current = v;
    }, []);

    const setLoopT = useCallback((v: number | null) => {
        loopTRef.current = v;
    }, []);

    const seek01 = useCallback((p: number, tmin: number, tmax: number) => {
        const clamped = Math.max(0, Math.min(1, p));
        tRef.current = tmin + (tmax - tmin) * clamped;
        // Immediate UI update for smooth dragging
        setUi({ t: tRef.current, progress01: clamped });
    }, []);

    const step = useCallback((deltaSec: number, tmin: number, tmax: number) => {
        if (!playingRef.current) return;

        const dt = deltaSec * speedRef.current;
        let t = tRef.current + dt;

        // Loop logic
        const loopT = loopTRef.current;
        if (loopT && loopT > 0) {
            const span = loopT;
            // loop relative to tmin? The user said "loop는 tmin 기준으로"
            // rel = (t - tmin) % span
            const rel = (t - tmin) % span;
            t = tmin + (rel < 0 ? rel + span : rel);
        } else {
            // Default: clamp within render range
            if (t > tmax) t = tmin;
            if (t < tmin) t = tmin;
        }

        tRef.current = t;

        // Throttle UI update
        const now = performance.now();
        if (now - lastUiUpdateRef.current > 100) {
            lastUiUpdateRef.current = now;
            const range = tmax - tmin || 1;
            const p01 = (t - tmin) / range;
            setUi({ t, progress01: Math.max(0, Math.min(1, p01)) });
        }
    }, []);

    return useMemo(() => ({
        tRef,
        playingRef,
        speedRef,
        loopTRef,
        ui,
        setPlaying,
        setSpeed,
        setLoopT,
        seek01,
        step
    }), [ui, setPlaying, setSpeed, setLoopT, seek01, step]);
}
