import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SavedExpression {
    id: string;
    name: string;
    code: string;
    latex?: string;
    createdAt: number;
    isFavorite: boolean;
}

interface HistoryState {
    history: SavedExpression[];
    favorites: SavedExpression[];

    addToHistory: (code: string, latex?: string) => void;
    removeFromHistory: (id: string) => void;
    clearHistory: () => void;

    toggleFavorite: (id: string, name?: string) => void;
    removeFavorite: (id: string) => void;
    renameFavorite: (id: string, name: string) => void;
}

const MAX_HISTORY = 20;

export const useHistoryStore = create<HistoryState>()(
    persist(
        (set, get) => ({
            history: [],
            favorites: [],

            addToHistory: (code, latex) => {
                const existing = get().history;
                // Don't add duplicates
                if (existing.length > 0 && existing[0].code === code) return;

                const entry: SavedExpression = {
                    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
                    name: extractName(code),
                    code,
                    latex,
                    createdAt: Date.now(),
                    isFavorite: false,
                };

                set({
                    history: [entry, ...existing].slice(0, MAX_HISTORY),
                });
            },

            removeFromHistory: (id) => {
                set({ history: get().history.filter(h => h.id !== id) });
            },

            clearHistory: () => set({ history: [] }),

            toggleFavorite: (id, name) => {
                const { history, favorites } = get();
                const existing = favorites.find(f => f.id === id);
                if (existing) {
                    set({ favorites: favorites.filter(f => f.id !== id) });
                } else {
                    const item = history.find(h => h.id === id);
                    if (item) {
                        set({
                            favorites: [
                                { ...item, isFavorite: true, name: name || item.name },
                                ...favorites,
                            ],
                        });
                    }
                }
            },

            removeFavorite: (id) => {
                set({ favorites: get().favorites.filter(f => f.id !== id) });
            },

            renameFavorite: (id, name) => {
                set({
                    favorites: get().favorites.map(f =>
                        f.id === id ? { ...f, name } : f
                    ),
                });
            },
        }),
        {
            name: 'helixplot-history',
        }
    )
);

function extractName(code: string): string {
    const lines = code.split('\n');
    // Try to find comment line as name
    const comment = lines.find(l => l.trim().startsWith('#'));
    if (comment) return comment.replace(/^#\s*/, '').trim().slice(0, 40);

    // Try to find function definition
    const fn = lines.find(l => l.includes('='));
    if (fn) return fn.trim().slice(0, 40);

    return 'Untitled';
}
