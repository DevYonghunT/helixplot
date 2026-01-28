import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Star, Trash2, Clock } from 'lucide-react';
import { useHistoryStore, type SavedExpression } from '../store/historyStore';

interface HistoryPanelProps {
    open: boolean;
    onClose: () => void;
    onLoad: (code: string, latex?: string) => void;
}

export function HistoryPanel({ open, onClose, onLoad }: HistoryPanelProps) {
    const { t } = useTranslation();
    const [tab, setTab] = useState<'recent' | 'favorites'>('recent');

    const history = useHistoryStore(s => s.history);
    const favorites = useHistoryStore(s => s.favorites);
    const removeFromHistory = useHistoryStore(s => s.removeFromHistory);
    const clearHistory = useHistoryStore(s => s.clearHistory);
    const toggleFavorite = useHistoryStore(s => s.toggleFavorite);
    const removeFavorite = useHistoryStore(s => s.removeFavorite);

    if (!open) return null;

    const items = tab === 'recent' ? history : favorites;

    const handleLoad = (item: SavedExpression) => {
        onLoad(item.code, item.latex);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
            <div
                role="dialog"
                aria-modal="true"
                aria-label={t('history.title')}
                className="w-full max-w-md bg-[var(--card)] rounded-3xl shadow-2xl border border-[var(--border)] overflow-hidden flex flex-col max-h-[80vh]"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 border-b border-[var(--border)] flex justify-between items-center bg-[var(--bg)]">
                    <h2 className="font-bold text-lg">{t('history.title')}</h2>
                    <button
                        onClick={onClose}
                        aria-label={t('app.cancel')}
                        className="w-8 h-8 rounded-full hover:bg-[var(--bg-button)] grid place-items-center"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-[var(--border)]">
                    <button
                        onClick={() => setTab('recent')}
                        className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${tab === 'recent' ? 'text-[var(--accent)] border-b-2 border-[var(--accent)]' : 'text-[var(--muted)]'}`}
                    >
                        <Clock size={14} />
                        {t('history.recent')}
                    </button>
                    <button
                        onClick={() => setTab('favorites')}
                        className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${tab === 'favorites' ? 'text-[var(--accent)] border-b-2 border-[var(--accent)]' : 'text-[var(--muted)]'}`}
                    >
                        <Star size={14} />
                        {t('history.favorites')}
                    </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-3 min-h-0">
                    {items.length === 0 ? (
                        <div className="text-center py-8 text-sm text-[var(--muted)]">
                            {tab === 'recent' ? t('history.empty') : t('history.empty_favorites')}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {items.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center gap-2 p-3 rounded-2xl bg-[var(--bg)] border border-[var(--border)] group"
                                >
                                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleLoad(item)}>
                                        <div className="text-sm font-medium truncate">{item.name}</div>
                                        <div className="text-xs text-[var(--muted)] font-mono truncate">{item.code.slice(0, 60)}</div>
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {tab === 'recent' && (
                                            <button
                                                onClick={() => toggleFavorite(item.id)}
                                                className="w-7 h-7 grid place-items-center rounded-full hover:bg-[var(--bg-button)]"
                                                aria-label="Toggle favorite"
                                            >
                                                <Star size={14} className={favorites.some(f => f.id === item.id) ? 'fill-yellow-400 text-yellow-400' : ''} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => tab === 'recent' ? removeFromHistory(item.id) : removeFavorite(item.id)}
                                            className="w-7 h-7 grid place-items-center rounded-full hover:bg-[var(--bg-button)] text-[var(--muted)] hover:text-red-500"
                                            aria-label={t('history.delete')}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {tab === 'recent' && history.length > 0 && (
                    <div className="p-3 border-t border-[var(--border)] flex justify-end">
                        <button
                            onClick={clearHistory}
                            className="text-xs text-[var(--muted)] hover:text-red-500 px-2 py-1"
                        >
                            {t('history.clear_all')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
