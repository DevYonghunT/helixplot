import React, { useState } from 'react';
import { Wheel } from '@uiw/react-color';
import type { PlaneTheme, PlaneColor } from '../hooks/usePlaneTheme';
import { useTranslation } from 'react-i18next';

function AlphaSlider({ alpha, onChange }: { alpha: number, onChange: (v: number) => void }) {
    return (
        <div className="flex items-center gap-2 mt-2">
            <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={alpha}
                onChange={e => onChange(parseFloat(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-[var(--accent)]"
            />
            <span className="text-xs w-9 text-right font-mono">{(alpha * 100).toFixed(0)}%</span>
        </div>
    );
}

function ColorInput({ hex, onChange }: { hex: string, onChange: (h: string) => void }) {
    return (
        <div className="flex items-center gap-2 mt-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg px-2 py-1">
            <span className="text-xs text-[var(--muted)]">#</span>
            <input
                type="text"
                value={hex.replace('#', '')}
                onChange={e => {
                    const val = e.target.value;
                    if (/^[0-9A-Fa-f]{0,6}$/.test(val)) {
                        onChange('#' + val);
                    }
                }}
                className="flex-1 w-full text-xs bg-transparent outline-none font-mono uppercase"
                maxLength={6}
            />
        </div>
    );
}

function PlaneSetting({
    label,
    color,
    onChange,
    recents,
    onAddRecent
}: {
    label: string,
    color: PlaneColor,
    onChange: (c: Partial<PlaneColor>) => void,
    recents?: string[],
    onAddRecent?: (hex: string) => void
}) {
    const { t } = useTranslation();

    return (
        <div className="flex flex-col items-center p-3 rounded-2xl bg-[var(--bg)] border border-[var(--border)]">
            <div className="text-sm font-bold mb-3 w-full text-center border-b border-[var(--border)] pb-2">{label}</div>

            <div className="flex gap-4 w-full justify-center">
                {/* Wheel */}
                <div className="flex-shrink-0">
                    <Wheel
                        color={color.hex}
                        onChange={(c) => onChange({ hex: c.hex })}
                        width={100}
                        height={100}
                    />
                </div>

                {/* Controls */}
                <div className="flex flex-col flex-1 gap-3 min-w-0 max-w-[120px]">
                    <div>
                        <div className="text-[10px] text-[var(--muted)] uppercase font-semibold mb-1">Color</div>
                        <ColorInput hex={color.hex} onChange={(h) => onChange({ hex: h })} />
                    </div>
                    <div>
                        <div className="text-[10px] text-[var(--muted)] uppercase font-semibold mb-1">Opacity</div>
                        <AlphaSlider alpha={color.alpha} onChange={(a) => onChange({ alpha: a })} />
                    </div>
                </div>
            </div>

            {/* Recents / Presets */}
            {recents && onAddRecent && (
                <div className="w-full mt-4">
                    <div className="text-[10px] text-[var(--muted)] uppercase font-semibold mb-2">{t('settings.recent_colors')}</div>
                    <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                        {recents.slice(0, 7).map(hex => (
                            <button
                                key={hex}
                                onClick={() => onChange({ hex })}
                                className="w-6 h-6 rounded-full border border-[var(--border)] shadow-sm transition-transform active:scale-95"
                                style={{ backgroundColor: hex }}
                                title={hex}
                            />
                        ))}
                        <button
                            onClick={() => onAddRecent(color.hex)}
                            className="w-6 h-6 rounded-full border border-[var(--border)] bg-gray-100 dark:bg-gray-800 grid place-items-center text-[10px] hover:bg-gray-200 dark:hover:bg-white/10"
                            title="Save Current"
                        >
                            +
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}


function SelectTrigger({ className, children, onClick }: { className?: string, children: React.ReactNode, onClick?: () => void }) {
    return (
        <button
            className={`flex h-10 w-full items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
            onClick={onClick}
        >
            {children}
            <span className="opacity-50">▼</span>
        </button>
    )
}

function SelectValue({ placeholder, children }: { placeholder?: string, children?: React.ReactNode }) {
    return (
        <span className="block truncate">{children || placeholder}</span>
    )
}

function LanguageSelect({ value, onChange }: { value: string, onChange: (v: string) => void }) {
    const [open, setOpen] = useState(false);

    const getLabel = (v: string) => {
        if (v === 'en') return 'English (United States)';
        if (v === 'ko') return '한국어 (대한민국)';
        return v;
    };

    return (
        <div className="relative">
            <SelectTrigger className="w-full [&>span]:truncate" onClick={() => setOpen(!open)}>
                <SelectValue placeholder={getLabel(value)} />
            </SelectTrigger>
            {open && (
                <div className="absolute top-full left-0 w-full mt-1 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-lg z-50 overflow-hidden py-1">
                    <button onClick={() => { onChange('en'); setOpen(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5">English (United States)</button>
                    <button onClick={() => { onChange('ko'); setOpen(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5">한국어 (대한민국)</button>
                </div>
            )}
        </div>
    );
}

export function SettingsModal({
    theme,
    updatePlane,
    onClose,
    recents,
    addRecent,
    onReset
}: {
    theme: PlaneTheme,
    updatePlane: (k: keyof PlaneTheme, c: Partial<PlaneColor>) => void,
    onClose: () => void,
    recents?: string[],
    addRecent?: (hex: string) => void,
    onReset?: () => void
}) {
    const { t, i18n } = useTranslation();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="w-full max-w-sm sm:max-w-2xl bg-[var(--card)] rounded-3xl shadow-2xl border border-[var(--border)] overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-[var(--border)] flex justify-between items-center bg-[var(--bg)]">
                    <h2 className="font-bold text-lg">{t('app.settings')}</h2>
                    <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-black/5 dark:hover:bg-white/10 grid place-items-center">✕</button>
                </div>

                <div className="p-4 overflow-y-auto min-h-0 flex-1 flex flex-col gap-6">

                    {/* Language Settings */}
                    <div>
                        <div className="text-sm font-bold mb-2 text-[var(--muted)] uppercase">{t('settings.language')}</div>
                        <LanguageSelect
                            value={i18n.language}
                            onChange={(lang) => i18n.changeLanguage(lang)}
                        />
                    </div>


                    <div>
                        <div className="text-sm font-bold mb-3 text-[var(--muted)] uppercase">{t('settings.appearance')}</div>
                        <div className="flex flex-col sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <PlaneSetting
                                label="XY Plane (Floor)"
                                color={theme.xy}
                                onChange={(c) => updatePlane('xy', c)}
                                recents={recents}
                                onAddRecent={addRecent}
                            />
                            <PlaneSetting
                                label="XZ Plane (Side)"
                                color={theme.xz}
                                onChange={(c) => updatePlane('xz', c)}
                                recents={recents}
                                onAddRecent={addRecent}
                            />
                            <PlaneSetting
                                label="YZ Plane (Front)"
                                color={theme.yz}
                                onChange={(c) => updatePlane('yz', c)}
                                recents={recents}
                                onAddRecent={addRecent}
                            />
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-[var(--border)] bg-[var(--bg)] flex justify-between items-center">
                    <button
                        onClick={onReset}
                        className="text-xs text-[var(--muted)] hover:text-[var(--accent-error)] px-2 py-1 underline decoration-dotted"
                    >
                        {t('settings.reset_theme')}
                    </button>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-[var(--accent)] text-white font-semibold rounded-xl active:scale-95 transition-transform shadow-lg shadow-[var(--accent)]/30"
                    >
                        {t('app.apply')}
                    </button>
                </div>
            </div>
        </div>
    );
}
