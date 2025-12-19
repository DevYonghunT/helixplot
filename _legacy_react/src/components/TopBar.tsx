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
        <div className="mx-auto max-w-[1200px] px-3 py-2 flex items-center gap-2">
            <div className="font-semibold tracking-tight">HelixPlot</div>

            <div className="ml-2 flex items-center gap-2">
                <select
                    value={preset}
                    onChange={(e) => onPreset(e.target.value)}
                    className="h-9 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 text-sm outline-none max-w-[160px] sm:max-w-[240px]"
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

            <div className="ml-auto flex items-center gap-2">
                {/* ViewMode toggle */}
                <button
                    onClick={onToggleViewMode}
                    className="h-9 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 text-sm hover:opacity-90"
                >
                    {viewMode === "diagram" ? "Diagram" : "Quad"}
                </button>

                {/* Theme toggle */}
                <button
                    onClick={onToggleTheme}
                    className="h-9 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 text-sm hover:opacity-90"
                >
                    {theme === "diagram" ? "Light" : "Dark"}
                </button>

                {/* placeholder icon buttons */}
                <IconButton onClick={onSettings}>⚙️</IconButton>
            </div>
        </div>
    );
}
