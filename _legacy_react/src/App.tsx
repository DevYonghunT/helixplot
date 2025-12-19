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
import { MathToolbar } from "./components/MathToolbar";
import { useHelixState } from "./hooks/useHelixState";
import { usePlaneTheme } from "./hooks/usePlaneTheme";
import { useAutoBound } from "./hooks/useAutoBound";
import { usePlaybackRuntime } from "./hooks/usePlaybackRuntime";
import { CORE_PRESETS, DEFAULT_PRESET_ID } from "./presets/corePresets";

export default function App() {
    const { input, setInput, errors, data, config, userPeriodT } = useHelixState();
    const { theme: planeTheme, updatePlane, recents, addRecent, resetTheme } = usePlaneTheme();
    const playbackRt = usePlaybackRuntime();
    const { bound, center } = useAutoBound(data);

    // refs
    const editorRef = useRef<HTMLTextAreaElement>(null);

    // theme/viewmode local state
    const [theme, setTheme] = useState<"diagram" | "modern">("diagram");
    const [viewMode, setViewMode] = useState<"diagram" | "quad">("diagram");
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
        }
    }, []);

    const handlePresetChange = (newId: string) => {
        setPreset(newId);
        const p = CORE_PRESETS.find(x => x.id === newId);
        if (p) {
            setInput(p.code);
        }
    };

    const handleInsertText = (text: string, moveCursor = 0) => {
        if (!editorRef.current) return;
        const textarea = editorRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const oldVal = textarea.value;
        const before = oldVal.substring(0, start);
        const after = oldVal.substring(end);

        const newVal = before + text + after;
        setInput(newVal);

        // Move cursor after render
        setTimeout(() => {
            textarea.focus();
            const newPos = start + text.length + moveCursor;
            textarea.setSelectionRange(newPos, newPos);
        }, 0);
    };

    useEffect(() => {
        document.documentElement.classList.remove("theme-diagram", "theme-modern");
        document.documentElement.classList.add(theme === "diagram" ? "theme-diagram" : "theme-modern");
    }, [theme]);

    const editorNode = (
        <Editor ref={editorRef} value={input} onChange={setInput} errors={errors} />
    );

    const toolbarNode = (
        <MathToolbar onInsert={handleInsertText} />
    );

    const inputPanelNode = (
        <InputPanel
            toolbar={toolbarNode}
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
                    <div className="h-[70dvh] sm:h-[60vh] lg:h-[68vh] min-h-0">
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
                                    <Viewport type="3d" className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)]" {...viewportProps} driveClock={true} />
                                    <Viewport type="xy" className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)]" {...viewportProps} />
                                    <Viewport type="xz" className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)]" {...viewportProps} />
                                    <Viewport type="yz" className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)]" {...viewportProps} />
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
