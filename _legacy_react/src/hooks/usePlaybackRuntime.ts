import { useMemo, useRef, useCallback } from "react";

export type PlaybackRuntime = {
    tRef: React.MutableRefObject<number>;
    playingRef: React.MutableRefObject<boolean>;
    speedRef: React.MutableRefObject<number>;
    loopTRef: React.MutableRefObject<number | null>;
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

    const setPlaying = useCallback((v: boolean) => {
        playingRef.current = v;
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
    }, []);

    const step = useCallback((deltaSec: number, tmin: number, tmax: number) => {
        if (!playingRef.current) return;

        const dt = deltaSec * speedRef.current;
        let t = tRef.current + dt;

        // Loop logic
        const loopT = loopTRef.current;
        if (loopT && loopT > 0) {
            const span = loopT;
            const rel = (t - tmin) % span;
            t = tmin + (rel < 0 ? rel + span : rel);
        } else {
            // Default: clamp within render range
            if (t > tmax) t = tmin;
            if (t < tmin) t = tmin;
        }

        tRef.current = t;
    }, []);

    return useMemo(() => ({
        tRef,
        playingRef,
        speedRef,
        loopTRef,
        setPlaying,
        setSpeed,
        setLoopT,
        seek01,
        step
    }), [setPlaying, setSpeed, setLoopT, seek01, step]);
}
