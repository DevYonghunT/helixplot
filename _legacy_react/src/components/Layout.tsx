import React from 'react';
import clsx from 'clsx';
import { Settings, Maximize2, Grid, Sun, Moon } from 'lucide-react';

interface LayoutProps {
    editor: React.ReactNode;
    viewports: React.ReactNode;
    controls: React.ReactNode;
    viewMode: 'diagram' | 'quad';
    theme: 'light' | 'dark';
    onToggleViewMode: () => void;
    onToggleTheme: () => void;
}

export const Layout: React.FC<LayoutProps> = ({
    editor, viewports, controls,
    viewMode, theme, onToggleViewMode, onToggleTheme
}) => {
    const isDiagram = viewMode === 'diagram';

    return (
        <div className="w-screen h-screen relative bg-[var(--bg-app)] overflow-hidden">
            {/* Main Content Area (Viewports) */}
            <div className="absolute inset-0 z-0">
                {viewports}
            </div>

            {/* Top Right Controls (Theme & ViewMode) */}
            <div className="absolute top-4 right-4 z-50 flex gap-2">
                <button
                    onClick={onToggleTheme}
                    className="btn-icon glass-panel"
                    title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Theme`}
                >
                    {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                </button>
                <button
                    onClick={onToggleViewMode}
                    className="btn-icon glass-panel"
                    title={isDiagram ? "Switch to Quad View" : "Switch to Diagram View"}
                >
                    {isDiagram ? <Grid size={18} /> : <Maximize2 size={18} />}
                </button>
            </div>

            {/* Editor Panel - Overlay in Diagram Mode, Side Panel in Quad Mode */}
            <section className={clsx(
                "transition-all duration-300 ease-in-out z-40",
                isDiagram
                    ? "absolute top-4 left-4 w-[360px] max-h-[calc(100vh-8rem)]" // Overlay
                    : "absolute top-4 left-4 bottom-24 w-1/3 min-w-[320px]"      // Side Panel (Quad)
            )}>
                <div className="w-full h-full flex flex-col glass-panel p-4 shadow-lg">
                    <h2 className="text-xs font-bold text-[var(--accent-primary)] mb-3 tracking-wider uppercase flex items-center gap-2">
                        <Settings size={14} />
                        Input Configuration
                    </h2>
                    <div className="flex-1 relative overflow-hidden">
                        {editor}
                    </div>
                </div>
            </section>

            {/* Bottom Controls - Overlay Bar in Diagram, Bottom Area in Quad */}
            <section className={clsx(
                "transition-all duration-300 ease-in-out z-40",
                isDiagram
                    ? "absolute bottom-6 left-1/2 -translate-x-1/2 w-[600px] max-w-[90vw]" // Floating Bar
                    : "absolute bottom-4 left-4 right-4 h-20"   // Bottom Bar (Quad)
            )}>
                <div className="w-full h-full glass-panel px-6 py-3 shadow-lg flex items-center justify-center">
                    {controls}
                </div>
            </section>
        </div>
    );
};
