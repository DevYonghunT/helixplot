import { useState } from "react";

export function MobileSheet({
    input,
    playback,
}: {
    input: React.ReactNode;
    playback: React.ReactNode;
}) {
    const [open, setOpen] = useState(true);
    const [tab, setTab] = useState<"playback" | "input">("playback");

    const translate = open ? "translate-y-0" : "translate-y-[calc(100%-56px)]";

    return (
        <div className="sm:hidden fixed inset-x-0 bottom-0 z-30 pb-[env(safe-area-inset-bottom)]">
            <div
                className={`rounded-t-3xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)] backdrop-blur transition-transform duration-200 ${translate}`}
            >
                {/* Grabber */}
                <div className="pt-2 pb-1 flex justify-center" onClick={() => setOpen(!open)}>
                    <div className="h-1.5 w-10 rounded-full bg-[var(--muted)]/30" />
                </div>

                {/* Tabs */}
                <div className="px-3 pb-2 flex gap-2">
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

                <div className="px-3 pb-4 max-h-[60vh] overflow-auto">
                    {tab === "playback" ? playback : input}
                </div>
            </div>
        </div>
    );
}
