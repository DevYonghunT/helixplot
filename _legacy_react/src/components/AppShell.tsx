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
        <div className="h-dvh flex flex-col bg-[var(--bg)] text-[var(--text)] overflow-hidden">
            {/* Top Bar with Safe Area */}
            <div className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur pt-[max(env(safe-area-inset-top),12px)] shrink-0">
                {topbar}
            </div>

            {/* Main Content Area: Fills remaining space */}
            <div className="flex-1 relative min-h-0 w-full mx-auto max-w-[1200px] flex flex-col">
                {/* Canvas Wrapper: Grows to fill */}
                <div className="flex-1 relative p-3 flex flex-col min-h-0">
                    <div className="flex-1 relative rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)] overflow-hidden w-full h-full">
                        {canvas}

                        {/* Desktop floating panel */}
                        <div className="hidden lg:block absolute left-4 top-4 w-[380px] pointer-events-auto">
                            {panel}
                        </div>
                    </div>

                    {/* Bottom bar (desktop/tablet) - Below canvas, inside main area to allow scrolling if needed? 
                       User said: "Viewport (main) flex-1 min-h-0... internal Canvas wrapper h-full w-full"
                       "Botttom sheet ... shrink-0 + pb-[env...]"
                       Wait, bottomBar here is Desktop bottom bar (PlaybackBar).
                       Mobile uses MobileSheet.
                       For desktop, put it below canvas.
                    */}
                    <div className="hidden sm:block mt-3 shrink-0">
                        {bottomBar}
                    </div>
                </div>
            </div>
        </div>
    );
}
