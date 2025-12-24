import { useRef, useState } from 'react';
import 'mathlive';
import clsx from 'clsx';
import { EquationEditorModal } from './EquationEditorModal';

export function EquationEditor({
    latex,
    onLatexChange,
    compiledExpr,
    error
}: {
    latex: string,
    onLatexChange: (l: string) => void,
    compiledExpr: string,
    error: string | null
}) {
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const mf = useRef<any>(null);

    // Keep the math-field just for PREVIEW in the bottom sheet.
    // It should be strictly read-only and no keyboard interaction.

    return (
        <div className="flex flex-col h-full bg-[var(--bg)]">
            <div className="p-4 flex-1 overflow-y-auto">
                <div className="flex items-start gap-2">
                    {/* Math Field Preview (Read Only) */}
                    <div className="flex-1 border border-[var(--accent)] rounded-xl overflow-hidden bg-white text-black shadow-sm mb-4 min-h-[56px] flex items-center relative">
                        {/* Overlay to catch clicks and open modal */}
                        <div
                            className="absolute inset-0 z-10 cursor-pointer"
                            onClick={() => setIsModalOpen(true)}
                        />
                        {/* @ts-ignore */}
                        <math-field
                            ref={mf}
                            style={{
                                width: '100%',
                                padding: '8px 16px',
                                fontSize: '24px',
                                border: 'none',
                                outline: 'none',
                                pointerEvents: 'none' // Ensure no interaction
                            }}
                            read-only
                        >
                            {latex}
                            {/* @ts-ignore */}
                        </math-field>
                    </div>

                    {/* Edit Button (Opens Modal) */}
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className={clsx(
                            "h-[56px] w-[56px] shrink-0 rounded-xl border border-[var(--border)] bg-[var(--card)] flex items-center justify-center text-xl shadow-sm transition-all active:scale-95 text-[var(--text)]"
                        )}
                        aria-label="Open Editor"
                    >
                        ⌨️
                    </button>
                </div>

                {/* Preview / Error */}
                <div className="mt-2">
                    <div className="text-[10px] font-bold text-[var(--muted)] uppercase mb-1 flex justify-between">
                        <span>Compiled DSL</span>
                        {compiledExpr && (
                            <button
                                onClick={() => navigator.clipboard.writeText(compiledExpr)}
                                className="text-[var(--accent)] hover:underline"
                            >
                                Copy
                            </button>
                        )}
                    </div>

                    <div className={clsx(
                        "p-3 rounded-lg font-mono text-xs break-all",
                        error ? "bg-red-50 text-red-600 border border-red-200" : "bg-[var(--card)] border border-[var(--border)] text-[var(--text-muted)]"
                    )}>
                        {error ? `Error: ${error}` : (compiledExpr || "(Empty)")}
                    </div>
                </div>
            </div>

            {/* Full Screen Editor Modal */}
            <EquationEditorModal
                open={isModalOpen}
                initialLatex={latex}
                onClose={() => setIsModalOpen(false)}
                onApply={(newLatex) => {
                    onLatexChange(newLatex);
                    // Modal closes automatically via onClose call in Modal component? 
                    // No, the prop says onApply just takes latex.
                    // We should close it here or inside?
                    // The usage inside Modal is: onApply(); onClose();
                    // So we are good.
                }}
            />
        </div>
    );
}
