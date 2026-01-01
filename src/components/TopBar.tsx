import React from "react";
import { CORE_PRESETS, type PresetCategory } from "../presets/corePresets";

function IconButton({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
    return (
        <button
            onClick={onClick}
            className="h-9 w-9 grid place-items-center rounded-xl border border-[var(--border)] bg-[var(--card)] hover:opacity-90 active:scale-[0.98]"
        >
            {children}
        </button>
    );
}

export function TopBar({
    preset,
    onPreset,
    theme,
    onToggleTheme,
    viewMode,
    onToggleViewMode,
    onSettings,
}: {
    preset: string;
    onPreset: (v: string) => void;
    theme: "diagram" | "modern";
    onToggleTheme: () => void;
    viewMode: "diagram" | "quad";
    onToggleViewMode: () => void;
    onSettings: () => void;
}) {
    const categories: PresetCategory[] = ["수학", "물리학", "화학", "생명과학", "지구과학"];

    return (
        <div className="mx-auto max-w-[1200px] px-3 pb-2 pt-2 flex flex-col gap-2">
            {/* Row 1: Title + Dropdown */}
            <div className="flex items-center gap-3 w-full">
                <div className="font-semibold tracking-tight shrink-0">HelixPlot</div>
                <select
                    value={preset}
                    onChange={(e) => onPreset(e.target.value)}
                    className="h-9 flex-1 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 text-sm outline-none w-full min-w-0"
                >
                    {categories.map((cat) => (
                        <optgroup key={cat} label={cat}>
                            {CORE_PRESETS.filter((p) => p.category === cat).map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name}
                                </option>
                            ))}
                        </optgroup>
                    ))}
                </select>
            </div>

            {/* Row 2: Controls */}
            <div className="flex items-center gap-2 flex-wrap">
                <button
                    onClick={onToggleViewMode}
                    className="h-9 flex-1 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 text-sm hover:opacity-90 whitespace-nowrap"
                >
                    {viewMode === "diagram" ? "Diagram View" : "Quad View"}
                </button>

                <button
                    onClick={onToggleTheme}
                    className="h-9 w-20 shrink-0 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 text-sm hover:opacity-90"
                >
                    {theme === "diagram" ? "Light" : "Dark"}
                </button>

                <IconButton onClick={onSettings}>⚙️</IconButton>
            </div>
        </div>
    );
}
