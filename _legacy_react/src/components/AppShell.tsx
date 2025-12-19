import React from "react";

export function AppShell({
    topbar,
    canvas,
    panel,
    bottomBar,
}: {
    topbar: React.ReactNode;
    canvas: React.ReactNode;
    panel: React.ReactNode;
    bottomBar: React.ReactNode;
}) {
    return (
        <div className="min-h-dvh bg-[var(--bg)] text-[var(--text)]">
            <div
                className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur"
                style={{ paddingTop: "max(env(safe-area-inset-top), 12px)" }}
            >
                {topbar}
            </div>

            <div className="relative mx-auto max-w-[1200px] px-3 py-2">
                {/* Canvas area */}
                <div className="relative rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)] overflow-hidden">
                    {canvas}

                    {/* Desktop floating panel */}
                    <div className="hidden lg:block absolute left-4 top-4 w-[380px]">
                        {panel}
                    </div>
                </div>

                {/* Bottom bar (desktop/tablet) */}
                <div className="hidden sm:block mt-3">
                    {bottomBar}
                </div>
            </div>
        </div>
    );
}
