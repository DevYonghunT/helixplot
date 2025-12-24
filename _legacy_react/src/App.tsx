import { useRef, useState, useEffect } from "react";
import { AppShell } from "./components/AppShell";
import { TopBar } from "./components/TopBar";
import { InputPanel } from "./components/InputPanel";
import { PlaybackBar } from "./components/PlaybackBar";
import { MobileSheet } from "./components/MobileSheet";
import { MobileQuadTabs } from "./components/MobileQuadTabs";
import { Editor } from "./components/Editor";
import { Viewport } from "./components/Viewport";
import { SettingsModal } from "./components/SettingsModal";
// (MathToolbar removed)
import { useHelixState } from "./hooks/useHelixState";
import { usePlaneTheme } from "./hooks/usePlaneTheme";
import { useAutoBound } from "./hooks/useAutoBound";
import { usePlaybackRuntime } from "./hooks/usePlaybackRuntime";
import { useKeyboardInset } from "./hooks/useKeyboardInset";
import { CORE_PRESETS, DEFAULT_PRESET_ID } from "./presets/corePresets";

export default function App() {
    const {
        input, setInput,
        latexInput, updateFromLatex, setLatexInputRaw,
        lastGoodExpr, exprError,
        errors, data, config, userPeriodT
    } = useHelixState();
    const { theme: planeTheme, updatePlane, recents, addRecent, resetTheme } = usePlaneTheme();
    const playbackRt = usePlaybackRuntime();
    const { bound, center } = useAutoBound(data);

    // refs
    const editorRef = useRef<HTMLTextAreaElement>(null);

    // theme/viewmode local state
    const [theme, setTheme] = useState<"diagram" | "modern">("diagram");
    const [viewMode, setViewMode] = useState<"diagram" | "quad">("diagram");
    // Initialize Global Keyboard Tracking
    useKeyboardInset();
    const [preset, setPreset] = useState(DEFAULT_PRESET_ID);
    const [showSettings, setShowSettings] = useState(false);

    // Sync user defined period to playback runtime
    useEffect(() => {
        const val = parseFloat(userPeriodT);
        playbackRt.setLoopT(isNaN(val) ? 0 : val);
    }, [userPeriodT, playbackRt]);

    // Force default preset on first load if input is default or empty
    useEffect(() => {
        const defaultFn = CORE_PRESETS.find(p => p.id === DEFAULT_PRESET_ID);
        if (defaultFn && (!input || input.includes("Lissajous"))) {
            // setInput(defaultFn.code); // Optional: Force overwrite initial state
            if (defaultFn.latex) setLatexInputRaw(defaultFn.latex);
        }
    }, []);

    const handlePresetChange = (newId: string) => {
        setPreset(newId);
        const p = CORE_PRESETS.find(x => x.id === newId);
        if (p) {
            setInput(p.code);
            if (p.latex) {
                setLatexInputRaw(p.latex); // Just set raw, don't trigger updateFromLatex to avoid double-update
            } else {
                setLatexInputRaw(""); // Clear if no latex provided
            }
        }
    };

    // function handleInsertText removed

    useEffect(() => {
        document.documentElement.classList.remove("theme-diagram", "theme-modern");
        document.documentElement.classList.add(theme === "diagram" ? "theme-diagram" : "theme-modern");
    }, [theme]);

    const editorNode = (
        <Editor
            ref={editorRef}
            value={input}
            onChange={setInput}
            errors={errors}
            // New Props
            latex={latexInput}
            onLatexChange={updateFromLatex}
            compiledExpr={lastGoodExpr}
            exprError={exprError}
        />
    );

    const inputPanelNode = (
        <InputPanel
            editor={editorNode}
            errors={errors}
            onRender={() => {/* already auto-rendering */ }}
        />
    );

    const playbackNode = (
        <PlaybackBar
            playbackRt={playbackRt}
            tRange={config.tRange}
        />
    );

    const viewportProps = {
        mode: config.mode,
        data: data,
        valBound: bound,
        valCenter: center,
        planeTheme: planeTheme,
        playbackRt: playbackRt,
        config: config
    };

    return (
        <>
            <AppShell
                topbar={
                    <TopBar
                        preset={preset}
                        onPreset={handlePresetChange}
                        theme={theme}
                        onToggleTheme={() => setTheme(theme === "diagram" ? "modern" : "diagram")}
                        viewMode={viewMode}
                        onToggleViewMode={() => setViewMode(viewMode === "diagram" ? "quad" : "diagram")}
                        onSettings={() => setShowSettings(true)}
                    />
                }
                canvas={
                    <div className="h-full w-full relative">
                        {viewMode === "diagram" ? (
                            <Viewport
                                type="3d"
                                showDiagramElements={true}
                                className="w-full h-full rounded-2xl"
                                driveClock={true}
                                {...viewportProps}
                            />
                        ) : (
                            <>
                                <div className="sm:hidden h-full">
                                    <MobileQuadTabs
                                        mode={config.mode}
                                        data={data}
                                        valBound={bound}
                                        valCenter={center}
                                        planeTheme={planeTheme}
                                        playbackRt={playbackRt}
                                        config={config}
                                    />
                                </div>
                                <div className="hidden sm:grid h-full grid-cols-2 grid-rows-2 gap-3">
                                    <Viewport type="3d" className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)]" {...viewportProps} showDiagramElements={true} driveClock={true} />
                                    <Viewport type="z" className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)]" {...viewportProps} showDiagramElements={true} />
                                    <Viewport type="y" className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)]" {...viewportProps} showDiagramElements={true} />
                                    <Viewport type="x" className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)]" {...viewportProps} showDiagramElements={true} />
                                </div>
                            </>
                        )}
                    </div>
                }
                panel={inputPanelNode}
                bottomBar={playbackNode}
            />

            <MobileSheet input={inputPanelNode} playback={playbackNode} />

            {showSettings && (
                <SettingsModal
                    theme={planeTheme}
                    updatePlane={updatePlane}
                    onClose={() => setShowSettings(false)}
                    recents={recents}
                    addRecent={addRecent}
                    onReset={resetTheme}
                />
            )}
        </>
    );
}
