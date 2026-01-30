import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';

interface ParameterSliderProps {
    params: Record<string, number>;
    onUpdate: (name: string, value: number) => void;
}

/** Estimate a reasonable slider range for a given value */
function estimateRange(value: number): { min: number; max: number; step: number } {
    const abs = Math.abs(value);

    if (abs === 0) return { min: -10, max: 10, step: 0.1 };

    // Determine order of magnitude
    const order = Math.pow(10, Math.floor(Math.log10(abs)));
    const step = order / 100;

    if (value > 0) {
        return { min: 0, max: Math.max(abs * 3, order * 10), step: Math.max(step, 0.001) };
    }
    return { min: Math.min(value * 3, -order * 10), max: 0, step: Math.max(step, 0.001) };
}

function SingleSlider({ name, value, onUpdate }: { name: string; value: number; onUpdate: (name: string, val: number) => void }) {
    const range = estimateRange(value);
    const [localValue, setLocalValue] = useState(value);
    const [customMin, setCustomMin] = useState(range.min);
    const [customMax, setCustomMax] = useState(range.max);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const v = parseFloat(e.target.value);
        setLocalValue(v);
        onUpdate(name, v);
    }, [name, onUpdate]);

    const handleMinChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const v = parseFloat(e.target.value);
        if (!isNaN(v)) setCustomMin(v);
    }, []);

    const handleMaxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const v = parseFloat(e.target.value);
        if (!isNaN(v)) setCustomMax(v);
    }, []);

    // Sync from external value changes (e.g., code editing)
    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    // Dynamic step: finer for smaller ranges
    const dynamicStep = (customMax - customMin) / 1000;

    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold text-[var(--text)] w-8 shrink-0">{name}</span>
                <input
                    type="range"
                    min={customMin}
                    max={customMax}
                    step={dynamicStep}
                    value={localValue}
                    onChange={handleChange}
                    className="flex-1 h-1.5 accent-[var(--accent)] cursor-pointer"
                    aria-label={`${name} parameter`}
                />
                <input
                    type="number"
                    value={parseFloat(localValue.toFixed(4))}
                    onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        if (!isNaN(v)) {
                            setLocalValue(v);
                            onUpdate(name, v);
                        }
                    }}
                    className="w-16 text-xs font-mono text-right bg-[var(--bg)] border border-[var(--border)] rounded-lg px-1.5 py-1 text-[var(--text)] outline-none focus:border-[var(--accent)]"
                    step={dynamicStep}
                    aria-label={`${name} value`}
                />
            </div>
            <div className="flex items-center gap-1 pl-8">
                <input
                    type="number"
                    value={customMin}
                    onChange={handleMinChange}
                    className="w-14 text-[10px] font-mono bg-transparent border-b border-[var(--border)] text-[var(--muted)] outline-none px-0.5"
                    aria-label={`${name} min range`}
                />
                <div className="flex-1 h-px bg-[var(--border)]" />
                <input
                    type="number"
                    value={customMax}
                    onChange={handleMaxChange}
                    className="w-14 text-[10px] font-mono bg-transparent border-b border-[var(--border)] text-[var(--muted)] outline-none px-0.5 text-right"
                    aria-label={`${name} max range`}
                />
            </div>
        </div>
    );
}

export function ParameterSlider({ params, onUpdate }: ParameterSliderProps) {
    const { t } = useTranslation();
    const [collapsed, setCollapsed] = useState(false);
    const entries = Object.entries(params);

    if (entries.length === 0) return null;

    return (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)] overflow-hidden">
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="w-full flex items-center justify-between px-3 py-2 hover:bg-[var(--bg-button)] transition-colors"
                aria-expanded={!collapsed}
            >
                <div className="flex items-center gap-2">
                    <SlidersHorizontal size={14} className="text-[var(--accent)]" />
                    <span className="text-sm font-semibold text-[var(--text)]">{t('params.title')}</span>
                    <span className="text-xs text-[var(--muted)]">({entries.length})</span>
                </div>
                {collapsed ? <ChevronDown size={14} className="text-[var(--muted)]" /> : <ChevronUp size={14} className="text-[var(--muted)]" />}
            </button>

            {!collapsed && (
                <div className="px-3 pb-3 flex flex-col gap-3">
                    {entries.map(([name, value]) => (
                        <SingleSlider key={name} name={name} value={value} onUpdate={onUpdate} />
                    ))}
                </div>
            )}
        </div>
    );
}
