import { useState } from "react";
import { Viewport } from "./Viewport";
import type { Mode, SampleResult, RenderConfig } from "../core/types";
import type { PlaneTheme } from "../hooks/usePlaneTheme";
import type { PlaybackRuntime } from "../hooks/usePlaybackRuntime";

type VType = "3d" | "x" | "y" | "z";

const TABS: { key: VType; label: string }[] = [
    { key: "3d", label: "3D" },
    { key: "x", label: "X Plane" },
    { key: "y", label: "Y Plane" },
    { key: "z", label: "Z Plane" },
];

export function MobileQuadTabs({
    mode,
    data,
    valBound,
    valCenter,
    planeTheme,
    playbackRt,
    config
}: {
    mode: Mode;
    data: SampleResult;
    valBound?: number;
    valCenter?: [number, number, number];
    planeTheme?: PlaneTheme;
    playbackRt?: PlaybackRuntime;
    config?: RenderConfig;
}) {
    const [active, setActive] = useState<VType>("3d");

    return (
        <div className="h-full flex flex-col">
            {/* Tabs */}
            <div className="px-3 pt-3">
                <div className="inline-flex rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)] p-1 gap-1 overflow-x-auto max-w-full no-scrollbar">
                    {TABS.map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setActive(t.key)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${active === t.key
                                ? "bg-[var(--accent)] text-white shadow-sm"
                                : "text-[var(--text-muted)] hover:bg-[var(--hover)]"
                                }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Active viewport */}
            <div className="flex-1 p-3 min-h-0">
                <div className="h-full rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)] overflow-hidden">
                    <div className="px-3 py-2 text-xs font-semibold tracking-wide text-[var(--muted)]">
                        {active.toUpperCase()} VIEW
                    </div>
                    <div className="h-[calc(100%-32px)] min-h-0">
                        <Viewport
                            type={active}
                            mode={mode}
                            data={data}
                            valBound={valBound}
                            valCenter={valCenter}
                            planeTheme={planeTheme}
                            playbackRt={playbackRt}
                            config={config}
                            driveClock={true}
                            showDiagramElements={true}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
