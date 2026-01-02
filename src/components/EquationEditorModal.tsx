import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Check } from 'lucide-react';
import { MathLiveInput, type MathLiveInputHandle } from "./MathLiveInput";
import { useTranslation } from 'react-i18next';
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
    const mfRef = useRef<MathLiveInputHandle>(null);

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
            mfRef={mfRef}
        />,
        document.body
    );
}

// Extracted Content Component for Portal context
function EquationEditorContent({
    initialLatex, onClose, onApply, dockRef, setDockHeight, dockHeight, mfRef
}: {
    initialLatex: string,
    onClose: () => void,
    onApply: (l: string) => void,
    dockRef: React.RefObject<HTMLDivElement | null>,
    setDockHeight: (h: number) => void,
    dockHeight: number,
    mfRef: React.MutableRefObject<MathLiveInputHandle | null>
}) {
    const { t } = useTranslation();
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
        mfRef.current?.insertLatex(template);
    };

    return (
        <div className="fixed inset-0 z-[9999]">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Sheet */}
            <div className="absolute inset-0 flex flex-col h-[100dvh] bg-white/90 backdrop-blur-xl shadow-2xl animate-in slide-in-from-bottom duration-300 ease-out pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">

                {/* Header */}
                <div className="shrink-0 relative px-4 h-14 flex items-center justify-between border-b border-black/5 bg-white/50 backdrop-blur-md">
                    {/* Sheet Handle */}
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-slate-200/80 rounded-full" />

                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100/50 transition-colors mt-2" aria-label={t('app.cancel')}>
                        <X size={24} />
                    </button>
                    <div className="font-semibold text-lg text-slate-800 mt-2">{t('app.equation')}</div>
                    <button
                        onClick={() => onApply(draftLatex)}
                        className="w-10 h-10 flex items-center justify-center rounded-full text-indigo-600 hover:bg-indigo-50/50 transition-colors mt-2"
                        aria-label={t('app.apply')}
                    >
                        <Check size={26} strokeWidth={2.5} />
                    </button>
                </div>

                {/* Body Scroll */}
                <div
                    className="flex-1 overflow-y-auto px-4 py-6"
                    style={{ paddingBottom: `calc(${dockHeight}px + env(safe-area-inset-bottom) + 24px)` }}
                >
                    {/* Input Card */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 min-h-[140px] relative">
                        {/* Wrapper for click gesture focus */}
                        <div
                            className="w-full"
                            onPointerDown={() => {
                                // Ensure focus on tap anywhere in the card
                                mfRef.current?.focus();
                            }}
                        >
                            <MathLiveInput
                                ref={mfRef}
                                valueLatex={draftLatex}
                                onChangeLatex={setDraftLatex}
                                dockRef={dockRef}
                                autoFocus={true}
                                onFocused={() => { }}
                            />
                        </div>
                    </div>

                    <div className="text-center text-xs font-medium text-slate-400 mt-6 tracking-wide uppercase opacity-70">
                        {t('editor.helper_text')}
                    </div>
                </div>

                {/* Dock Area */}
                <div
                    className="absolute left-0 right-0 bottom-5 z-50 bg-slate-50/95 backdrop-blur-xl border-t border-slate-200/50 pb-[env(safe-area-inset-bottom)]"
                    ref={dockRef}
                    onPointerDownCapture={() => {
                        mfRef.current?.focus();
                    }}
                >
                    {/* QuickBar */}
                    <div className="flex items-center gap-2 px-3 py-2.5 overflow-x-auto [&::-webkit-scrollbar]:hidden touch-pan-x">
                        {QUICK_SYMBOLS.map((s, i) => (
                            <button
                                key={i}
                                onPointerDown={(e) => {
                                    e.preventDefault();
                                    handleQuickInsert(s.template);
                                }}
                                className="h-10 min-w-[3.5rem] px-0 rounded-full bg-slate-100 text-slate-700 text-[15px] font-medium transition-all active:scale-95 active:bg-indigo-100 active:text-indigo-600 flex items-center justify-center font-mono shrink-0 shadow-sm border border-slate-200/50"
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>

                    {/* MathLive Keyboard Container */}
                    <div className="w-full" id="mathlive-keyboard-container">
                        {/* MathLive will portal its keyboard here */}
                    </div>
                </div>
            </div>
        </div>
    );
}
