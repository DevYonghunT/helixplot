import { useState, useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { Keyboard } from "@capacitor/keyboard";

export function MobileSheet({
    input,
    playback,
}: {
    input: React.ReactNode;
    playback: React.ReactNode;
}) {
    const [open, setOpen] = useState(true);
    const [tab, setTab] = useState<"playback" | "input">("playback");
    const sheetRef = useRef<HTMLDivElement>(null);

    // Track Virtual Keyboard Height
    useEffect(() => {
        const isNative = Capacitor.isNativePlatform();
        let cleanup = () => { };

        if (isNative) {
            // Native: Use Capacitor Keyboard Plugin
            const onShow = Keyboard.addListener('keyboardWillShow', info => {
                if (sheetRef.current) {
                    sheetRef.current.style.setProperty('--kb', `${info.keyboardHeight}px`);
                }
            });
            const onHide = Keyboard.addListener('keyboardWillHide', () => {
                if (sheetRef.current) {
                    sheetRef.current.style.setProperty('--kb', '0px');
                }
            });

            cleanup = () => {
                onShow.then(h => h.remove());
                onHide.then(h => h.remove());
            };
        } else {
            // Web: Use VisualViewport
            if (!window.visualViewport) return;

            const handleResize = () => {
                if (!sheetRef.current) return;
                const vv = window.visualViewport;
                if (!vv) return;

                const kbHeight = window.innerHeight - vv.height;
                const safeKb = Math.max(0, kbHeight);

                sheetRef.current.style.setProperty('--kb', `${safeKb}px`);
            };

            window.visualViewport.addEventListener('resize', handleResize);
            window.visualViewport.addEventListener('scroll', handleResize);
            handleResize(); // Init

            cleanup = () => {
                window.visualViewport?.removeEventListener('resize', handleResize);
                window.visualViewport?.removeEventListener('scroll', handleResize);
            };
        }

        return cleanup;
    }, []);

    // Auto-scroll to focused element
    useEffect(() => {
        const onFocus = (e: FocusEvent) => {
            const el = e.target as HTMLElement;
            // Check if element is inside sheet (or is math field)
            if (sheetRef.current?.contains(el)) {
                setTimeout(() => {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 50);
            }
        };

        // Capture phase to detect focus early
        document.addEventListener('focus', onFocus, true);
        return () => document.removeEventListener('focus', onFocus, true);
    }, []);

    const translate = open ? "translate-y-0" : "translate-y-[calc(100%-56px)]";

    return (
        // Wrapper: Fixed to bottom, adjusts padding for Safe Area + Keyboard
        // Using style var --kb calculated from JS
        <div
            ref={sheetRef}
            className="sm:hidden fixed inset-x-0 bottom-0 z-30 transition-all duration-200 ease-out"
            style={{
                paddingBottom: "calc(env(safe-area-inset-bottom) + var(--kb, 0px))"
            }}
        >
            <div
                className={`flex flex-col rounded-t-3xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)] backdrop-blur transition-transform duration-200 ${translate}`}
            >
                {/* Grabber */}
                <div className="pt-2 pb-1 flex justify-center shrink-0" onClick={() => setOpen(!open)}>
                    <div className="h-1.5 w-10 rounded-full bg-[var(--muted)]/30" />
                </div>

                {/* Tabs */}
                <div className="px-3 pb-2 flex gap-2 shrink-0">
                    <button
                        onClick={() => setTab("playback")}
                        className={`flex-1 h-9 rounded-2xl border border-[var(--border)] text-sm ${tab === "playback" ? "bg-[var(--accent)] text-white" : "bg-transparent"
                            }`}
                    >
                        Playback
                    </button>
                    <button
                        onClick={() => setTab("input")}
                        className={`flex-1 h-9 rounded-2xl border border-[var(--border)] text-sm ${tab === "input" ? "bg-[var(--accent)] text-white" : "bg-transparent"
                            }`}
                    >
                        Input
                    </button>
                </div>

                {/* Content: Scrollable within max-height */}
                <div className="px-3 pb-4 max-h-[70dvh] overflow-y-auto min-h-0">
                    {tab === "playback" ? playback : input}
                </div>

                {/* Keyboard Dock Area - Outside scroll view */}
                <div id="math-keyboard-dock" className="px-3 pb-[calc(env(safe-area-inset-bottom)+12px)] min-h-[0px]" />
            </div>
        </div>
    );
}
