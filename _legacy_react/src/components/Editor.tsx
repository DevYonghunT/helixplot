import { forwardRef, useState } from 'react';
import clsx from 'clsx';
import { EquationEditor } from './EquationEditor';

interface EditorProps {
    value: string;
    onChange: (value: string) => void;
    errors: string[];
    // New
    latex: string;
    compiledExpr: string;
    exprError: string | null;
    // Global Modal Trigger
    onOpenEquationEditor?: () => void;
}

export const Editor = forwardRef<HTMLTextAreaElement, EditorProps>(({
    value, onChange, errors,
    latex, compiledExpr, exprError,
    onOpenEquationEditor
}, ref) => {
    const [mode, setMode] = useState<'code' | 'eq'>('eq'); // Default to Eq mode as requested for "Codecogs UX"

    return (
        <div className="flex flex-col h-full gap-2 transition-all">
            {/* Mode Switch */}
            {/* Mode Switch (Segmented Control) */}
            <div className="flex bg-[var(--bg-panel)] p-1 rounded-full border border-[var(--border)] self-start h-10 w-full sm:w-auto relative">
                <button
                    onClick={() => setMode('eq')}
                    className={clsx(
                        "flex-1 sm:flex-none px-6 h-full rounded-full text-sm font-semibold transition-all duration-200 z-10",
                        mode === 'eq'
                            ? "bg-white text-black shadow-[0_2px_8px_rgba(0,0,0,0.12)] scale-[1.02]"
                            : "text-[var(--text-muted)] hover:text-[var(--text)]"
                    )}
                >
                    Equation
                </button>
                <button
                    onClick={() => setMode('code')}
                    className={clsx(
                        "flex-1 sm:flex-none px-6 h-full rounded-full text-sm font-semibold transition-all duration-200 z-10",
                        mode === 'code'
                            ? "bg-white text-black shadow-[0_2px_8px_rgba(0,0,0,0.12)] scale-[1.02]"
                            : "text-[var(--text-muted)] hover:text-[var(--text)]"
                    )}
                >
                    Raw Code
                </button>
            </div>

            {mode === 'code' ? (
                <textarea
                    ref={ref}
                    className="flex-1 w-full bg-transparent resize-none outline-none mono text-sm leading-6 text-[var(--text-primary)]"
                    spellCheck={false}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="# Define your function here\nx(t) = cos(10*t)\n..."
                />
            ) : (
                <div className="flex-1 w-full bg-[var(--bg)] border border-[var(--border)] rounded-2xl overflow-hidden min-h-0">
                    <EquationEditor
                        latex={latex}
                        compiledExpr={compiledExpr}
                        error={exprError}
                        onOpenEditor={onOpenEquationEditor}
                    />
                </div>
            )}

            {errors.length > 0 && mode === 'code' && (
                <div className="h-24 overflow-y-auto shrink-0 border-t border-[var(--bg-panel-border)] pt-2 mt-2">
                    {errors.map((err, i) => (
                        <div key={i} className="text-xs text-[var(--accent-error)] mono">
                            {err}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
});
