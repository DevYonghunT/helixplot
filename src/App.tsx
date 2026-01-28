import { useRef, useEffect, useState } from "react";
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
import { ExportModal } from "./components/ExportModal";
import { ToastContainer } from "./components/Toast";
import { ParameterSlider } from "./components/ParameterSlider";
import { AdBanner } from "./components/AdBanner";
import { Onboarding } from "./components/Onboarding";
import { SplashScreen } from "./components/SplashScreen";
import { useInterstitialAd } from "./hooks/useInterstitialAd";
import { AdService } from "./services/AdService";

import { useHelixState } from "./hooks/useHelixState";
import { usePlaneTheme } from "./hooks/usePlaneTheme";
import { useAutoBound } from "./hooks/useAutoBound";
import { usePlaybackRuntime } from "./hooks/usePlaybackRuntime";
import { useKeyboardInset } from "./hooks/useKeyboardInset";
import { useAppStore } from "./store/useAppStore";
import { useHistoryStore } from "./store/historyStore";
import { CORE_PRESETS, DEFAULT_PRESET_ID } from "./presets/corePresets";
import { parseShareURL } from "./utils/export";

export default function App() {
    const [splashDone, setSplashDone] = useState(false);
    const {
        input, setInput,
        latexInput, updateFromLatex, setLatexInputRaw,
        lastGoodExpr, exprError,
        errors, data, config, userPeriodT,
        detectedParams, updateParam
    } = useHelixState();

    const { theme: planeTheme, updatePlane, recents, addRecent, resetTheme } = usePlaneTheme();
    const playbackRt = usePlaybackRuntime();
    const { bound, center } = useAutoBound(data);

    // Zustand store
    const theme = useAppStore(s => s.theme);
    const toggleTheme = useAppStore(s => s.toggleTheme);
    const viewMode = useAppStore(s => s.viewMode);
    const toggleViewMode = useAppStore(s => s.toggleViewMode);
    const preset = useAppStore(s => s.preset);
    const setPreset = useAppStore(s => s.setPreset);
    const showSettings = useAppStore(s => s.showSettings);
    const setShowSettings = useAppStore(s => s.setShowSettings);
    const eqOpen = useAppStore(s => s.eqModalOpen);
    const setEqOpen = useAppStore(s => s.setEqModalOpen);
    const incrementPresetChange = useAppStore(s => s.incrementPresetChange);

    // Export modal
    const [exportOpen, setExportOpen] = useState(false);

    // History - auto-save on expression change
    const addToHistory = useHistoryStore(s => s.addToHistory);

    // Global keyboard inset
    useKeyboardInset();

    // Ad system
    useInterstitialAd();
    useEffect(() => { AdService.initialize(); }, []);

    const editorRef = useRef<HTMLTextAreaElement>(null);

    // userPeriodT -> runtime loopT sync
    useEffect(() => {
        const val = parseFloat(userPeriodT);
        playbackRt.setLoopT(isNaN(val) ? 0 : val);
    }, [userPeriodT, playbackRt]);

    // Load shared URL or default preset on mount
    useEffect(() => {
        const shared = parseShareURL();
        if (shared?.code) {
            setInput(shared.code);
            if (shared.latex) setLatexInputRaw(shared.latex);
            // Clean URL params after loading
            window.history.replaceState({}, '', window.location.pathname);
            return;
        }

        const defaultFn = CORE_PRESETS.find(p => p.id === DEFAULT_PRESET_ID);
        if (defaultFn && (!input || input.includes("Lissajous"))) {
            if (defaultFn.latex) setLatexInputRaw(defaultFn.latex);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handlePresetChange = (newId: string) => {
        // Save current expression to history before switching
        if (input.trim()) addToHistory(input, latexInput);

        setPreset(newId);
        incrementPresetChange();
        const p = CORE_PRESETS.find(x => x.id === newId);
        if (!p) return;

        setInput(p.code);
        setLatexInputRaw(p.latex ?? "");
    };

    // Theme class sync
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
            onOpenEquationEditor={() => setEqOpen(true)}
        />
    );

    const paramSliderNode = (
        <ParameterSlider params={detectedParams} onUpdate={updateParam} />
    );

    const inputPanelNode = (
        <InputPanel
            editor={editorNode}
            errors={errors}
            onRender={() => { /* already auto-rendering */ }}
            paramSlider={paramSliderNode}
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
            {!splashDone && <SplashScreen onComplete={() => setSplashDone(true)} />}

            <AppShell
                topbar={
                    <TopBar
                        preset={preset}
                        onPreset={handlePresetChange}
                        theme={theme}
                        onToggleTheme={toggleTheme}
                        viewMode={viewMode}
                        onToggleViewMode={toggleViewMode}
                        onSettings={() => setShowSettings(true)}
                        onExport={() => setExportOpen(true)}
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
                bottomBar={<>{playbackNode}<AdBanner size="leaderboard" className="hidden sm:flex mt-2" /></>}
            />

            <MobileSheet input={inputPanelNode} playback={playbackNode} />

            <EquationEditorModal
                open={eqOpen}
                initialLatex={latexInput}
                onClose={() => setEqOpen(false)}
                onApply={(latex) => updateFromLatex(latex)}
            />

            <ExportModal
                open={exportOpen}
                onClose={() => setExportOpen(false)}
                code={input}
                latex={latexInput}
            />

            <ToastContainer />
            <Onboarding />

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
