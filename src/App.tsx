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
import { EquationEditorModal } from "./components/EquationEditorModal";

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

    // Global keyboard inset
    useKeyboardInset();

    const editorRef = useRef<HTMLTextAreaElement>(null);

    const [theme, setTheme] = useState<"diagram" | "modern">("diagram");
    const [viewMode, setViewMode] = useState<"diagram" | "quad">("diagram");
    const [preset, setPreset] = useState(DEFAULT_PRESET_ID);
    const [showSettings, setShowSettings] = useState(false);

    // ✅ B안: App 루트에서만 모달 상태 관리
    const [eqOpen, setEqOpen] = useState(false);

    // userPeriodT -> runtime loopT 동기화(PlaybackBar props 아님!)
    useEffect(() => {
        const val = parseFloat(userPeriodT);
        playbackRt.setLoopT(isNaN(val) ? 0 : val);
    }, [userPeriodT, playbackRt]);

    // 초기 프리셋/라텍스 셋
    useEffect(() => {
        const defaultFn = CORE_PRESETS.find(p => p.id === DEFAULT_PRESET_ID);
        if (defaultFn && (!input || input.includes("Lissajous"))) {
            if (defaultFn.latex) setLatexInputRaw(defaultFn.latex);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handlePresetChange = (newId: string) => {
        setPreset(newId);
        const p = CORE_PRESETS.find(x => x.id === newId);
        if (!p) return;

        setInput(p.code);
        setLatexInputRaw(p.latex ?? "");
    };

    useEffect(() => {
        document.documentElement.classList.remove("theme-diagram", "theme-modern");
        document.documentElement.classList.add(theme === "diagram" ? "theme-diagram" : "theme-modern");
    }, [theme]);

    const viewportProps = {
        mode: config.mode,
        data,
        valBound: bound,
        valCenter: center,
        planeTheme,
        playbackRt,
        config
    };

    const editorNode = (
        <Editor
            ref={editorRef}
            value={input}
            onChange={setInput}
            errors={errors}
            latex={latexInput}
            compiledExpr={lastGoodExpr}
            exprError={exprError}
            // ✅ Editor/EquationEditor가 이 prop을 받도록 아래 2)도 같이 적용
            onOpenEquationEditor={() => setEqOpen(true)}
        />
    );

    const inputPanelNode = (
        <InputPanel
            editor={editorNode}
            errors={errors}
            onRender={() => { /* already auto-rendering */ }}
        />
    );

    const playbackNode = (
        <PlaybackBar
            playbackRt={playbackRt}
            tRange={config.tRange}
        />
    );

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

            {/* ✅ App 루트 단일 모달 */}
            <EquationEditorModal
                open={eqOpen}
                initialLatex={latexInput}
                onClose={() => setEqOpen(false)}
                onApply={(latex) => updateFromLatex(latex)}
            />

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
