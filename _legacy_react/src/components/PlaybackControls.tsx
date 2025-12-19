import React from 'react';
import { Play, Pause } from 'lucide-react';

interface PlaybackControlsProps {
    playing: boolean;
    onTogglePlay: () => void;
    progress: number; // 0..1
    onSeek: (val: number) => void;
    speed: number;
    onSpeedChange: (speed: number) => void;
    tRange: [number, number];
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
    playing,
    onTogglePlay,
    progress,
    onSeek,
    speed,
    onSpeedChange,
    tRange
}) => {
    return (
        <div className="flex items-center gap-6 h-full text-[var(--text-muted)] text-sm">
            <div className="flex items-center gap-2">
                <button
                    onClick={onTogglePlay}
                    className="w-10 h-10 rounded-full bg-[var(--accent-primary)] text-black flex items-center justify-center hover:opacity-90 transition-opacity"
                >
                    {playing ? <Pause size={18} fill="black" /> : <Play size={18} fill="black" className="ml-0.5" />}
                </button>
            </div>

            <div className="flex-1 flex flex-col gap-1">
                <div className="flex justify-between text-xs font-mono">
                    <span>t: {tRange[0].toFixed(2)}</span>
                    <span>current: {(tRange[0] + progress * (tRange[1] - tRange[0])).toFixed(2)}</span>
                    <span>{tRange[1].toFixed(2)}</span>
                </div>
                <input
                    type="range"
                    min={0} max={1} step={0.001}
                    value={progress}
                    onChange={(e) => onSeek(parseFloat(e.target.value))}
                    className="w-full accent-[var(--accent-primary)] h-1 bg-[var(--bg-panel-border)] rounded-lg appearance-none cursor-pointer"
                />
            </div>

            <div className="flex items-center gap-2">
                <span className="text-xs uppercase">Speed</span>
                <select
                    value={speed}
                    onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
                    className="bg-transparent border border-[var(--bg-panel-border)] rounded px-2 py-1 text-xs outline-none"
                >
                    <option value={0.25}>0.25x</option>
                    <option value={0.5}>0.5x</option>
                    <option value={1}>1x</option>
                    <option value={2}>2x</option>
                    <option value={4}>4x</option>
                </select>
            </div>
        </div>
    );
};
