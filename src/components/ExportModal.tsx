import { useTranslation } from 'react-i18next';
import { useEffect, useRef } from 'react';
import { Download, Link, Copy, X } from 'lucide-react';
import { captureCanvasPNG, downloadDataURL, buildShareURL, copyToClipboard } from '../utils/export';
import { useToast } from './Toast';

interface ExportModalProps {
    open: boolean;
    onClose: () => void;
    code: string;
    latex?: string;
}

export function ExportModal({ open, onClose, code, latex }: ExportModalProps) {
    const { t } = useTranslation();
    const toast = useToast();
    const dialogRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [open, onClose]);

    if (!open) return null;

    const handleDownloadPNG = () => {
        const dataURL = captureCanvasPNG();
        if (dataURL) {
            downloadDataURL(dataURL, `helixplot-${Date.now()}.png`);
            toast.success(t('export.png_saved'));
        } else {
            toast.error(t('export.no_canvas'));
        }
    };

    const handleCopyLink = async () => {
        const url = buildShareURL(code, latex);
        const success = await copyToClipboard(url);
        if (success) {
            toast.success(t('export.link_copied'));
        } else {
            toast.error(t('export.copy_failed'));
        }
    };

    const handleCopyCode = async () => {
        const success = await copyToClipboard(code);
        if (success) {
            toast.success(t('export.code_copied'));
        } else {
            toast.error(t('export.copy_failed'));
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-label={t('export.title')}
                className="w-full max-w-sm bg-[var(--card)] rounded-3xl shadow-2xl border border-[var(--border)] overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-4 border-b border-[var(--border)] flex justify-between items-center bg-[var(--bg)]">
                    <h2 className="font-bold text-lg">{t('export.title')}</h2>
                    <button
                        onClick={onClose}
                        aria-label={t('app.cancel')}
                        className="w-8 h-8 rounded-full hover:bg-[var(--bg-button)] grid place-items-center focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="p-4 flex flex-col gap-3">
                    <button
                        onClick={handleDownloadPNG}
                        className="flex items-center gap-3 w-full p-3 rounded-2xl bg-[var(--bg)] border border-[var(--border)] hover:bg-[var(--bg-button)] transition-colors text-left"
                    >
                        <Download size={20} className="text-[var(--accent)] shrink-0" />
                        <div>
                            <div className="text-sm font-semibold">{t('export.download_png')}</div>
                            <div className="text-xs text-[var(--muted)]">{t('export.download_png_desc')}</div>
                        </div>
                    </button>

                    <button
                        onClick={handleCopyLink}
                        className="flex items-center gap-3 w-full p-3 rounded-2xl bg-[var(--bg)] border border-[var(--border)] hover:bg-[var(--bg-button)] transition-colors text-left"
                    >
                        <Link size={20} className="text-[var(--accent)] shrink-0" />
                        <div>
                            <div className="text-sm font-semibold">{t('export.copy_link')}</div>
                            <div className="text-xs text-[var(--muted)]">{t('export.copy_link_desc')}</div>
                        </div>
                    </button>

                    <button
                        onClick={handleCopyCode}
                        className="flex items-center gap-3 w-full p-3 rounded-2xl bg-[var(--bg)] border border-[var(--border)] hover:bg-[var(--bg-button)] transition-colors text-left"
                    >
                        <Copy size={20} className="text-[var(--accent)] shrink-0" />
                        <div>
                            <div className="text-sm font-semibold">{t('export.copy_code')}</div>
                            <div className="text-xs text-[var(--muted)]">{t('export.copy_code_desc')}</div>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
}
