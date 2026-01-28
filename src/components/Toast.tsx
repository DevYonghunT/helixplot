import { create } from 'zustand';

type ToastType = 'info' | 'success' | 'error' | 'warning';

interface ToastItem {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastState {
    toasts: ToastItem[];
    addToast: (message: string, type?: ToastType) => void;
    removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set, get) => ({
    toasts: [],
    addToast: (message, type = 'info') => {
        const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 4);
        set({ toasts: [...get().toasts, { id, message, type }] });
        // Auto-remove after 3s
        setTimeout(() => {
            set({ toasts: get().toasts.filter(t => t.id !== id) });
        }, 3000);
    },
    removeToast: (id) => {
        set({ toasts: get().toasts.filter(t => t.id !== id) });
    },
}));

const ICON_MAP: Record<ToastType, string> = {
    info: 'ℹ',
    success: '✓',
    error: '✕',
    warning: '⚠',
};

const COLOR_MAP: Record<ToastType, string> = {
    info: 'var(--accent)',
    success: '#22c55e',
    error: '#ef4444',
    warning: '#f59e0b',
};

export function ToastContainer() {
    const toasts = useToastStore(s => s.toasts);
    const removeToast = useToastStore(s => s.removeToast);

    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-[10000] flex flex-col gap-2 pointer-events-none" role="status" aria-live="polite">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-lg backdrop-blur-xl animate-in slide-in-from-right duration-200 max-w-sm"
                >
                    <span
                        className="w-6 h-6 rounded-full grid place-items-center text-white text-xs font-bold shrink-0"
                        style={{ backgroundColor: COLOR_MAP[toast.type] }}
                    >
                        {ICON_MAP[toast.type]}
                    </span>
                    <span className="text-sm text-[var(--text)] flex-1">{toast.message}</span>
                    <button
                        onClick={() => removeToast(toast.id)}
                        className="text-[var(--muted)] hover:text-[var(--text)] text-xs shrink-0"
                        aria-label="Dismiss"
                    >
                        ✕
                    </button>
                </div>
            ))}
        </div>
    );
}

/** Convenience hook for toasting */
export function useToast() {
    const addToast = useToastStore(s => s.addToast);
    return {
        toast: (message: string, type?: ToastType) => addToast(message, type),
        info: (message: string) => addToast(message, 'info'),
        success: (message: string) => addToast(message, 'success'),
        error: (message: string) => addToast(message, 'error'),
        warning: (message: string) => addToast(message, 'warning'),
    };
}
