import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Check } from 'lucide-react';
import { MathLiveInput } from './MathLiveInput';
import 'katex/dist/katex.min.css';

interface EquationEditorModalProps {
    open: boolean;
    initialLatex: string;
    onClose: () => void;
    onApply: (latex: string) => void;
}

// Quick Bar Symbols
const QUICK_SYMBOLS = [
    { label: 'frac', template: '\\frac{#0}{#1}' },
    { label: '√', template: '\\sqrt{#0}' },
    { label: '^', template: '^{#0}' },
    { label: '_', template: '_{#0}' },
    { label: 'π', template: '\\pi' },
    { label: 'θ', template: '\\theta' },
    { label: 'sin', template: '\\sin(#0)' },
    { label: 'cos', template: '\\cos(#0)' },
    { label: 'tan', template: '\\tan(#0)' },
    { label: 'log', template: '\\log(#0)' },
    { label: 'ln', template: '\\ln(#0)' },
    { label: 'e', template: 'e^{#0}' },
];

export function EquationEditorModal({ open, initialLatex, onClose, onApply }: EquationEditorModalProps) {
    const dockRef = useRef<HTMLDivElement>(null);
    const [dockHeight, setDockHeight] = useState(280); // Default guess

    // Use Portal? Only if open
    if (!open) return null;

    return createPortal(
        <EquationEditorContent
            initialLatex={initialLatex}
            onClose={onClose}
            onApply={onApply}
            dockRef={dockRef}
            setDockHeight={setDockHeight}
            dockHeight={dockHeight}
        />,
        document.body
    );
}

// Extracted Content Component for Portal context 
function EquationEditorContent({
    initialLatex, onClose, onApply, dockRef, setDockHeight, dockHeight
}: {
    initialLatex: string,
    onClose: () => void,
    onApply: (l: string) => void,
    dockRef: React.RefObject<HTMLDivElement | null>,
    setDockHeight: (h: number) => void,
    dockHeight: number
}) {
    const [draftLatex, setDraftLatex] = useState(initialLatex);

    // Sync draft with prop if it changes (e.g. re-opening)
    useEffect(() => {
        setDraftLatex(initialLatex);
    }, [initialLatex]);

    // Lock body scroll
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; }
    }, []);

    // Measure Dock Height
    useEffect(() => {
        if (!dockRef.current) return;
        const ro = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setDockHeight(entry.contentRect.height);
            }
        });
        ro.observe(dockRef.current);
        return () => ro.disconnect();
    }, [dockRef, setDockHeight]);

    // Handle QuickBar Insert
    const handleQuickInsert = (template: string) => {
        // @ts-ignore
        const mf = document.activeElement as any;
        if (mf && mf.tagName === 'MATH-FIELD') {
            mf.executeCommand(['insert', template, { format: 'latex' }]);
        }
    };

    return (
        <div className="eqm-overlay">
            <div className="eqm-sheet">
                {/* Header */}
                <div className="eqm-header shrink-0 border-b border-[var(--border)] bg-white">
                    <button onClick={onClose} className="eqm-header-btn text-[var(--muted)] hover:bg-slate-100">
                        <X size={24} />
                    </button>
                    <div className="font-bold text-lg text-slate-800">Equation</div>
                    <button
                        onClick={() => onApply(draftLatex)}
                        className="eqm-header-btn text-[var(--accent)] hover:bg-[var(--accent-light)]"
                    >
                        <Check size={28} strokeWidth={3} />
                    </button>
                </div>

                {/* Body Scroll */}
                <div
                    className="eqm-body"
                    style={{ paddingBottom: `calc(${dockHeight}px + env(safe-area-inset-bottom) + 16px)` }}
                >
                    {/* Input Card */}
                    <div className="eqm-card min-h-[120px] flex items-center justify-center mb-6 relative">
                        <MathLiveInput
                            valueLatex={draftLatex}
                            onChangeLatex={setDraftLatex}
                            dockRef={dockRef}
                            autoFocus={true}
                            onFocused={() => { }}
                        />
                    </div>

                    <div className="text-center text-xs text-slate-400 mt-4">
                        Use the keyboard below to edit
                    </div>
                </div>

                {/* Dock Area */}
                <div className="eqm-dock" ref={dockRef}>
                    {/* QuickBar */}
                    <div className="eqm-bar">
                        {QUICK_SYMBOLS.map((s, i) => (
                            <button
                                key={i}
                                onClick={() => handleQuickInsert(s.template)}
                                className="h-10 min-w-[50px] px-3 rounded-xl bg-white border border-slate-200 text-sm font-medium hover:bg-slate-50 active:bg-[var(--accent)] active:text-white transition-all shrink-0 flex items-center justify-center font-mono shadow-sm mx-[2px]"
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>

                    {/* MathLive Keyboard Container */}
                    <div className="eqm-kbd" id="mathlive-keyboard-container" style={{ minHeight: '200px' }}>
                        {/* MathLive will portal its keyboard here */}
                    </div>
                </div>
            </div>
        </div>
    );
}
