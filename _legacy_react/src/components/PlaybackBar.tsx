import React, { useRef, useState } from "react";
import type { PlaybackRuntime } from "../hooks/usePlaybackRuntime";

function PlaybackButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            onClick={onClick}
            className="h-10 w-10 grid place-items-center rounded-full bg-[var(--accent)] text-white hover:opacity-90 active:scale-95 transition-transform"
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
    const { ui, playingRef, speedRef, setPlaying, setSpeed, seek01 } = playbackRt;

    // Force re-render for Play icon toggle
    const [_, forceUpdate] = useState(0);

    const handleToggle = () => {
        setPlaying(!playingRef.current);
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
    };

    const tLabel = `t: ${ui.t.toFixed(2)}`;

    return (
        <div className="mx-auto max-w-[600px] h-16 rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)] backdrop-blur px-4 flex items-center gap-4">
            {/* Play/Pause */}
            <PlaybackButton onClick={handleToggle}>
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
                    <div className="flex items-center gap-2">
                        <button onClick={() => handleSpeedChange(Math.max(0.1, speedRef.current - 0.1))} className="hover:text-[var(--foreground)]">-</button>
                        <span>{speedRef.current.toFixed(1)}x</span>
                        <button onClick={() => handleSpeedChange(speedRef.current + 0.1)} className="hover:text-[var(--foreground)]">+</button>
                    </div>
                </div>

                {/* Progress Bar */}
                <div
                    ref={progressBarRef}
                    onPointerDown={handlePointerDown}
                    className="h-2 w-full rounded-full bg-[var(--muted)]/20 cursor-pointer relative overflow-hidden group touch-none"
                    onPointerMove={(e) => {
                        if (e.buttons > 0) handlePointerDown(e);
                    }}
                >
                    <div
                        className="absolute top-0 left-0 h-full bg-[var(--accent)] transition-all duration-100 ease-linear rounded-full"
                        style={{ width: `${ui.progress01 * 100}%` }}
                    />
                </div>
            </div>

            {/* Speed Select (Optional visual sugar) */}
            <select
                className="bg-transparent text-xs font-bold text-[var(--text-muted)] outline-none text-right w-12"
                value={speedRef.current}
                onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
            >
                <option value={0.5}>0.5x</option>
                <option value={1}>1.0x</option>
                <option value={2}>2.0x</option>
                <option value={5}>5.0x</option>
            </select>
        </div>
    );
}
