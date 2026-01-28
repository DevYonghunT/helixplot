import React from "react";
import { useTranslation } from "react-i18next";

export function InputPanel({
    editor,
    errors,
    onRender,
    paramSlider,
}: {
    editor: React.ReactNode;
    errors: string[];
    onRender: () => void;
    paramSlider?: React.ReactNode;
}) {
    const { t } = useTranslation();

    return (
        <div className="flex flex-col gap-2">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)] backdrop-blur p-3">
                <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">{t('mobile.input')}</div>
                    <button
                        onClick={onRender}
                        className="h-8 px-3 rounded-xl bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 active:scale-[0.99]"
                    >
                        {t('input.render')}
                    </button>
                </div>

                <div className="mt-2">{editor}</div>

                {errors.length > 0 && (
                    <div className="mt-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-600">
                        {errors.slice(0, 3).map((e, i) => (
                            <div key={i}>{e}</div>
                        ))}
                    </div>
                )}

                <div className="mt-2 text-[11px] text-[var(--muted)]">
                    {t('input.tip')}
                </div>
            </div>

            {paramSlider}
        </div>
    );
}
