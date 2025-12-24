import { useEffect, useRef, useState } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { X, Check } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';

interface EquationEditorModalProps {
    open: boolean;
    initialLatex: string;
    onClose: () => void;
    onApply: (latex: string) => void;
}

export function EquationEditorModal({ open, initialLatex, onClose, onApply }: EquationEditorModalProps) {
    const [draftLatex, setDraftLatex] = useState(initialLatex);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Sync initial state
    useEffect(() => {
        if (open) {
            setDraftLatex(initialLatex);
            // Focus logic
            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.focus();
                    // Optional: show keyboard manually if needed
                    if (Capacitor.isNativePlatform()) {
                        Keyboard.show().catch(() => { });
                    }
                }
            }, 100);
        }
    }, [open, initialLatex]);

    // Handle Render Preview
    const renderPreview = () => {
        try {
            return katex.renderToString(draftLatex || '\\text{Empty}', {
                throwOnError: false,
                displayMode: true,
                output: 'html'
            });
        } catch (e) {
            return `<span class="text-red-500">Invalid LaTeX</span>`;
        }
    };

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 bg-[var(--bg)] flex flex-col"
            style={{
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                paddingTop: 'env(safe-area-inset-top)',
                // paddingBottom handled inside scroll container or here?
                // If we want the toolbar fixed at bottom of safe area, we do flex.
                // But keyboard pushes logic relies on --kb.
            }}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 h-14 border-b border-[var(--border)] bg-[var(--card)] shrink-0">
                <button
                    onClick={onClose}
                    className="p-2 -ml-2 text-[var(--muted)] hover:text-[var(--text)]"
                >
                    <X size={24} />
                </button>
                <div className="font-semibold">Equation Editor</div>
                <button
                    onClick={() => {
                        onApply(draftLatex);
                        onClose();
                    }}
                    className="p-2 -mr-2 text-[var(--accent)] font-bold"
                >
                    <Check size={24} />
                </button>
            </div>

            {/* Scrollable Content */}
            <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto p-4 flex flex-col gap-6"
                style={{
                    // Keyboard padding
                    paddingBottom: "calc(var(--kb, 0px) + env(safe-area-inset-bottom) + 20px)"
                }}
            >
                {/* Preview Card */}
                <div className="bg-white rounded-xl shadow-sm border border-[var(--border)] p-6 min-h-[100px] flex items-center justify-center text-black overflow-x-auto">
                    <div dangerouslySetInnerHTML={{ __html: renderPreview() }} />
                </div>

                {/* Input Area */}
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-[var(--muted)]">LaTeX Source</label>
                    <textarea
                        ref={textareaRef}
                        value={draftLatex}
                        onChange={e => setDraftLatex(e.target.value)}
                        className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 text-base font-mono resize-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] outline-none"
                        rows={5}
                        inputMode="text"
                        placeholder="\sin(x)..."
                        onFocus={() => {
                            // Scroll into view logic
                            setTimeout(() => {
                                textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }, 300);
                        }}
                    />
                </div>

                <div className="text-xs text-[var(--muted)] text-center mt-4">
                    Supports Standard LaTeX Commands
                </div>
            </div>
        </div>
    );
}
