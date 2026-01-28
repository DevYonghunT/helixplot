import React, { useRef, useState } from "react";
import type { PlaybackRuntime } from "../hooks/usePlaybackRuntime";

function PlaybackButton({ onClick, children, ariaLabel }: { onClick: () => void; children: React.ReactNode; ariaLabel?: string }) {
    return (
        <button
            onClick={onClick}
            aria-label={ariaLabel}
            className="h-10 w-10 grid place-items-center rounded-full bg-[var(--accent)] text-white hover:opacity-90 active:scale-95 transition-transform focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
        >
            {children}
        </button>
    );
}

export function PlaybackBar({
    playbackRt,
    tRange
}: {
    playbackRt: PlaybackRuntime;
    tRange: [number, number];
}) {
    const progressBarRef = useRef<HTMLDivElement>(null);
    const { playingRef, speedRef, setPlaying, setSpeed, seek01, tRef } = playbackRt;

    // Local UI State
    const [displayState, setDisplayState] = useState({ t: tRange[0], progress01: 0 });
    // Force re-render for Play icon toggle
    const [_, forceUpdate] = useState(0);

    // Sync loop: Reads tRef and updates UI throttled
    React.useEffect(() => {
        let rafId = 0;
        let lastUpdate = 0;

        const update = (now: number) => {
            if (now - lastUpdate > 100) { // 100ms throttle
                lastUpdate = now;
                const t = tRef.current;
                const min = tRange[0];
                const max = tRange[1];
                const range = max - min || 1;
                const p = Math.max(0, Math.min(1, (t - min) / range));

                // Only setState if changed significantly? 
                // Or just blindly set. React won't re-render if value same? 
                // Object identity changes, so it will.
                // Let's rely on setState batching.
                setDisplayState({ t, progress01: p });
            }
            rafId = requestAnimationFrame(update);
        };
        rafId = requestAnimationFrame(update);
        return () => cancelAnimationFrame(rafId);
    }, [tRange, tRef]);

    const handleToggle = () => {
        const next = !playingRef.current;
        setPlaying(next);
        forceUpdate(c => c + 1);
    };

    const handleSpeedChange = (v: number) => {
        setSpeed(v);
        forceUpdate(c => c + 1);
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        if (!progressBarRef.current) return;
        const rect = progressBarRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const p = Math.max(0, Math.min(1, x / rect.width));
        seek01(p, tRange[0], tRange[1]);

        // Immediate visual update
        const t = tRange[0] + (tRange[1] - tRange[0]) * p;
        setDisplayState({ t, progress01: p });
    };

    const tLabel = `t: ${displayState.t.toFixed(2)}`;

    return (
        <div className="mx-auto max-w-[600px] h-16 rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)] backdrop-blur px-4 flex items-center gap-4 select-none touch-none">
            {/* Play/Pause */}
            <PlaybackButton onClick={handleToggle} ariaLabel={playingRef.current ? "Pause" : "Play"}>
                {playingRef.current ? (
                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                        <rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" />
                        <rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" />
                    </svg>
                ) : (
                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                        <path d="M8 5V19L19 12L8 5Z" fill="currentColor" />
                    </svg>
                )}
            </PlaybackButton>

            <div className="flex-1 flex flex-col justify-center gap-1">
                <div className="flex justify-between text-xs font-mono text-[var(--text-muted)]">
                    <span>{tLabel}</span>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => handleSpeedChange(Math.max(0.1, speedRef.current - 0.1))}
                            className="w-7 h-7 grid place-items-center rounded-full hover:bg-[var(--bg-button)] transition-colors focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                            aria-label="Decrease speed"
                        >
                            -
                        </button>
                        <span className="w-8 text-center">{speedRef.current.toFixed(1)}x</span>
                        <button
                            onClick={() => handleSpeedChange(speedRef.current + 0.1)}
                            className="w-7 h-7 grid place-items-center rounded-full hover:bg-[var(--bg-button)] transition-colors focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                            aria-label="Increase speed"
                        >
                            +
                        </button>
                    </div>
                </div>

                {/* Progress Bar */}
                <div
                    ref={progressBarRef}
                    onPointerDown={handlePointerDown}
                    className="h-2 w-full rounded-full bg-[var(--muted)]/20 cursor-pointer relative overflow-hidden group touch-none"
                    role="slider"
                    aria-label="Playback progress"
                    aria-valuemin={tRange[0]}
                    aria-valuemax={tRange[1]}
                    aria-valuenow={displayState.t}
                    tabIndex={0}
                    onKeyDown={(e) => {
                        const step = 0.05;
                        if (e.key === 'ArrowRight') seek01(Math.min(1, displayState.progress01 + step), tRange[0], tRange[1]);
                        if (e.key === 'ArrowLeft') seek01(Math.max(0, displayState.progress01 - step), tRange[0], tRange[1]);
                    }}
                    onPointerMove={(e) => {
                        if (e.buttons > 0) handlePointerDown(e);
                    }}
                >
                    <div
                        className="absolute top-0 left-0 h-full bg-[var(--accent)] transition-all duration-100 ease-linear rounded-full"
                        style={{ width: `${displayState.progress01 * 100}%` }}
                    />
                </div>
            </div>

            {/* Speed Select (Optional visual sugar) */}
            <select
                className="bg-transparent text-xs font-bold text-[var(--text-muted)] outline-none text-right w-12"
                value={speedRef.current}
                onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                aria-label="Playback speed"
            >
                <option value={0.5}>0.5x</option>
                <option value={1}>1.0x</option>
                <option value={2}>2.0x</option>
                <option value={5}>5.0x</option>
            </select>
        </div>
    );
}
