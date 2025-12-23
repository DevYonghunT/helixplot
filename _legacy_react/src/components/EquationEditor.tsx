import { useEffect, useRef, useState } from 'react';
import 'mathlive';
import clsx from 'clsx';
// Reuse existing toolbar but adapt it? 
// Current MathToolbar inserts 'sin()'. For MathInput we might want '\sin'.
// But let's see. If we insert 'sin()' into MathField, it might parse it.
// MathLive is smart.

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
    const mf = useRef<any>(null);

    // Sync external latex to field (only if different to avoid cursor jump issues, tricky)
    useEffect(() => {
        if (mf.current && mf.current.value !== latex) {
            const el = mf.current;
            if (document.activeElement !== el) {
                el.value = latex;
            }
        }
    }, [latex]);

    useEffect(() => {
        const el = mf.current;
        if (!el) return;

        const onInput = () => {
            const val = el.value;
            onLatexChange(val);
        };
        el.addEventListener('input', onInput);
        return () => el.removeEventListener('input', onInput);
    }, [onLatexChange]);

    // Manual Keyboard Logic
    const [vkOpen, setVkOpen] = useState(false);

    useEffect(() => {
        // @ts-ignore
        const vk = window.mathVirtualKeyboard;
        if (!vk) return;

        // @ts-ignore
        vk.policy = "manual";

        // Helper to dock
        const dock = document.getElementById("math-keyboard-dock");
        if (dock) {
            vk.container = dock;
        }

        return () => {
            // Cleanup? If we unmount, maybe hide keyboard?
            vk.hide();
        };
    }, []);

    // Keyboard Toggle Logic
    const toggleVK = () => {
        setVkOpen(prev => !prev);
    };

    // Effect to handle show/hide based on state
    useEffect(() => {
        // @ts-ignore
        const vk = window.mathVirtualKeyboard;
        if (!vk) return;

        if (vkOpen) {
            // Ensure docked
            const dock = document.getElementById("math-keyboard-dock");
            if (dock && vk.container !== dock) {
                vk.container = dock;
            }

            // Focus field then show keyboard
            if (mf.current) {
                mf.current.focus();
            }
            vk.show();

            // Scroll into view logic
            setTimeout(() => {
                mf.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);

        } else {
            vk.hide();
        }
    }, [vkOpen]);

    // Listen for VK state changes potentially? MathLive doesn't easily expose "is open" listener via global usually,
    // but we can trust our state or verify.
    // Actually, letting math-field handle focus might trigger it too if we aren't careful?
    // User said "read-only + inputmode=none". 

    return (
        <div className="flex flex-col h-full bg-[var(--bg)]">
            <div className="p-4 flex-1 overflow-y-auto">
                <div className="flex items-start gap-2">
                    {/* Math Field */}
                    <div className="flex-1 border border-[var(--accent)] rounded-xl overflow-hidden bg-white text-black shadow-sm mb-4 min-h-[56px] flex items-center">
                        {/* @ts-ignore */}
                        <math-field
                            ref={mf}
                            style={{
                                width: '100%',
                                padding: '8px 16px',
                                fontSize: '24px',
                                border: 'none',
                                outline: 'none',
                            }}
                            // Manual Keyboard Config
                            virtual-keyboard-mode="manual"
                            read-only
                            inputmode="none"
                            onPointerDown={() => {
                                // Prevent default focus/keyboard behavior
                                // e.preventDefault(); 
                                // Actually preventDefault might stop focus?
                                // We want focus but NO native keyboard.
                                // read-only/inputmode=none does that mostly.
                                // We just ensure VK opens.
                                if (!vkOpen) toggleVK();
                            }}
                        >
                            {latex}
                            {/* @ts-ignore */}
                        </math-field>
                    </div>

                    {/* Keyboard Toggle Button */}
                    <button
                        onClick={toggleVK}
                        className={clsx(
                            "h-[56px] w-[56px] shrink-0 rounded-xl border border-[var(--border)] bg-[var(--card)] flex items-center justify-center text-xl shadow-sm transition-all active:scale-95",
                            vkOpen ? "text-[var(--accent)] border-[var(--accent)]" : "text-[var(--text-muted)]"
                        )}
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
        </div>
    );
}
