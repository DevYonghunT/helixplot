import { forwardRef, useState } from 'react';
import clsx from 'clsx';
import { EquationEditorPanel } from './EquationEditor';

interface EditorProps {
    value: string;
    onChange: (value: string) => void;
    errors: string[];
}

export const Editor = forwardRef<HTMLTextAreaElement, EditorProps>(({ value, onChange, errors }, ref) => {
    const [mode, setMode] = useState<'code' | 'eq'>('code');

    return (
        <div className="flex flex-col h-full gap-2 transition-all">
            {/* Mode Switch */}
            <div className="flex bg-[var(--bg)] p-1 rounded-xl border border-[var(--border)] self-start">
                <button
                    onClick={() => setMode('code')}
                    className={clsx(
                        "px-4 py-1 text-xs font-bold rounded-lg transition-colors",
                        mode === 'code'
                            ? "bg-[var(--accent)] text-white shadow-sm"
                            : "text-[var(--text-muted)] hover:bg-gray-100 dark:hover:bg-white/5"
                    )}
                >
                    Code
                </button>
                <button
                    onClick={() => setMode('eq')}
                    className={clsx(
                        "px-4 py-1 text-xs font-bold rounded-lg transition-colors",
                        mode === 'eq'
                            ? "bg-[var(--accent)] text-white shadow-sm"
                            : "text-[var(--text-muted)] hover:bg-gray-100 dark:hover:bg-white/5"
                    )}
                >
                    Eq. Mode
                </button>
            </div>

            {mode === 'code' ? (
                <textarea
                    ref={ref}
                    className="flex-1 w-full bg-transparent resize-none outline-none mono text-sm leading-6 text-[var(--text-primary)]"
                    spellCheck={false}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="# Define your function here\nx(t) = cos(10*t)\ny(t) = sin(10*t)\nz(t) = t"
                />
            ) : (
                <div className="flex-1 w-full bg-[var(--bg)] border border-[var(--border)] rounded-2xl overflow-hidden min-h-0">
                    <EquationEditorPanel code={value} onCodeChange={onChange} />
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
