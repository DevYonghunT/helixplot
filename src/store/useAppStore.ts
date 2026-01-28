import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_PRESET_ID } from '../presets/corePresets';

interface AppState {
    // Theme
    theme: 'diagram' | 'modern';
    setTheme: (theme: 'diagram' | 'modern') => void;
    toggleTheme: () => void;

    // View Mode
    viewMode: 'diagram' | 'quad';
    setViewMode: (mode: 'diagram' | 'quad') => void;
    toggleViewMode: () => void;

    // Preset
    preset: string;
    setPreset: (id: string) => void;

    // Modals
    showSettings: boolean;
    setShowSettings: (v: boolean) => void;
    eqModalOpen: boolean;
    setEqModalOpen: (v: boolean) => void;

    // Onboarding
    hasSeenOnboarding: boolean;
    setHasSeenOnboarding: (v: boolean) => void;

    // Ad state
    presetChangeCount: number;
    incrementPresetChange: () => void;
    lastAdShownAt: number;
    setLastAdShownAt: (t: number) => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            // Theme
            theme: 'diagram',
            setTheme: (theme) => set({ theme }),
            toggleTheme: () => set((s) => ({ theme: s.theme === 'diagram' ? 'modern' : 'diagram' })),

            // View Mode
            viewMode: 'diagram',
            setViewMode: (viewMode) => set({ viewMode }),
            toggleViewMode: () => set((s) => ({ viewMode: s.viewMode === 'diagram' ? 'quad' : 'diagram' })),

            // Preset
            preset: DEFAULT_PRESET_ID,
            setPreset: (preset) => set({ preset }),

            // Modals
            showSettings: false,
            setShowSettings: (showSettings) => set({ showSettings }),
            eqModalOpen: false,
            setEqModalOpen: (eqModalOpen) => set({ eqModalOpen }),

            // Onboarding
            hasSeenOnboarding: false,
            setHasSeenOnboarding: (hasSeenOnboarding) => set({ hasSeenOnboarding }),

            // Ad tracking
            presetChangeCount: 0,
            incrementPresetChange: () => set((s) => ({ presetChangeCount: s.presetChangeCount + 1 })),
            lastAdShownAt: 0,
            setLastAdShownAt: (lastAdShownAt) => set({ lastAdShownAt }),
        }),
        {
            name: 'helixplot-app-state',
            partialize: (state) => ({
                theme: state.theme,
                hasSeenOnboarding: state.hasSeenOnboarding,
            }) as AppState,
        }
    )
);
