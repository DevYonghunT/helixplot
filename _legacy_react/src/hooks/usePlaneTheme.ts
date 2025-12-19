import { useState, useEffect } from 'react';

export interface PlaneColor {
    hex: string;
    alpha: number;
}

export interface PlaneTheme {
    xy: PlaneColor;
    xz: PlaneColor;
    yz: PlaneColor;
}

export const DEFAULT_THEME: PlaneTheme = {
    xy: { hex: "#3B82F6", alpha: 0.1 }, // Blue
    xz: { hex: "#22C55E", alpha: 0.1 }, // Green
    yz: { hex: "#EF4444", alpha: 0.1 }, // Red
};

export const RECENT_COLORS_DEFAULT = [
    "#3B82F6", "#22C55E", "#EF4444", "#F59E0B", "#8B5CF6", "#EC4899", "#111827", "#FFFFFF"
];

export function usePlaneTheme() {
    const [theme, setTheme] = useState<PlaneTheme>(() => {
        const saved = localStorage.getItem('helix_plane_theme');
        return saved ? JSON.parse(saved) : DEFAULT_THEME;
    });

    const [recents, setRecents] = useState<string[]>(() => {
        const saved = localStorage.getItem("helix-recent-colors");
        return saved ? JSON.parse(saved) : RECENT_COLORS_DEFAULT;
    });

    useEffect(() => {
        localStorage.setItem('helix_plane_theme', JSON.stringify(theme));
    }, [theme]);

    useEffect(() => {
        localStorage.setItem("helix-recent-colors", JSON.stringify(recents));
    }, [recents]);

    const updatePlane = (plane: keyof PlaneTheme, updates: Partial<PlaneColor>) => {
        setTheme(prev => ({
            ...prev,
            [plane]: { ...prev[plane], ...updates }
        }));
    };

    const addRecent = (hex: string) => {
        setRecents(prev => {
            const temp = prev.filter(c => c !== hex);
            return [hex, ...temp].slice(0, 10);
        });
    };

    const resetTheme = () => {
        setTheme(DEFAULT_THEME);
    };

    return { theme, updatePlane, recents, addRecent, resetTheme };
}
