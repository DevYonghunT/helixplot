import { useState, useEffect, useRef } from "react";

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

    // Auto-scroll to focused element (Keep this?)
    // Actually, if we use modal for equation, this might not be needed for equation input anymore.
    // But maybe for playback inputs? Let's leave it or remove it if not needed.
    // User didn't explicitly ask to remove focus scrolling, just "Docking logic".
    // I'll leave the focus listener for now, just remove the keyboard tracking.

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
        // Wrapper: Fixed to bottom, adjusts padding for Safe Area + Keyboard + Virtual Keyboard
        // Using style var --kb (system keyboard) and --vk (virtual keyboard)
        <div
            ref={sheetRef}
            className="sm:hidden fixed inset-x-0 bottom-0 z-30 transition-all duration-200 ease-out"
            style={{
                paddingBottom: "calc(env(safe-area-inset-bottom) + var(--kb, 0px))", // System keyboard padding
            }}
        >
            <div
                className={`flex flex-col rounded-t-3xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)] backdrop-blur transition-transform duration-200 ${translate}`}
                style={{
                    maxHeight: "85dvh" // Increased height to accommodate keyboard
                }}
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

                {/* Content: Flex column layout for scroll + dock */}
                <div className="flex flex-col flex-1 min-h-0">
                    <div className="flex-1 overflow-y-auto px-3 pb-4">
                        {tab === "playback" ? playback : input}
                    </div>
                </div>
            </div>
        </div>
    );
}
