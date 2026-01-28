/**
 * Export utilities for HelixPlot
 * - PNG screenshot from Three.js canvas
 * - Share URL with encoded expression
 * - Clipboard copy
 * - Native Capacitor support (Filesystem + Share)
 */
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

/** Capture the active Three.js canvas as a PNG data-URL */
export function captureCanvasPNG(): string | null {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    if (!canvas) return null;
    return canvas.toDataURL('image/png');
}

/** Extract base64 data from a data-URL */
function dataURLtoBase64(dataURL: string): string {
    return dataURL.split(',')[1] ?? '';
}

/**
 * Save PNG to device gallery (native) or trigger download (web).
 * Returns true on success.
 */
export async function savePNG(dataURL: string, filename: string): Promise<boolean> {
    if (Capacitor.isNativePlatform()) {
        try {
            const base64Data = dataURLtoBase64(dataURL);
            // Write to cache first, then share to allow saving to gallery
            const result = await Filesystem.writeFile({
                path: filename,
                data: base64Data,
                directory: Directory.Cache,
            });

            // Use the native share sheet so user can save to Photos/Gallery
            await Share.share({
                title: filename,
                files: [result.uri],
            });
            return true;
        } catch {
            return false;
        }
    }

    // Web fallback: anchor download
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return true;
}

/** Web-based share URL (for deployed web version only) */
const WEB_BASE_URL = 'https://helixplot.web.app';

/** Build a share URL with the current expression encoded as a query param */
export function buildShareURL(code: string, latex?: string): string {
    // On native Capacitor, window.location.origin is not a real web URL
    // Use a fixed web base URL instead
    const base = Capacitor.isNativePlatform()
        ? WEB_BASE_URL
        : window.location.origin + window.location.pathname;
    const params = new URLSearchParams();
    params.set('expr', code);
    if (latex) params.set('latex', latex);
    return `${base}?${params.toString()}`;
}

/**
 * Share content using native share sheet (native) or clipboard (web).
 * For native: opens the OS share dialog with the URL.
 * For web: copies to clipboard.
 */
export async function shareLink(code: string, latex?: string): Promise<boolean> {
    const url = buildShareURL(code, latex);

    if (Capacitor.isNativePlatform()) {
        try {
            await Share.share({
                title: 'HelixPlot',
                text: code,
                url,
                dialogTitle: 'Share Expression',
            });
            return true;
        } catch {
            // User may have cancelled the share sheet
            return false;
        }
    }

    // Web fallback: try Web Share API first, then clipboard
    if (navigator.share) {
        try {
            await navigator.share({ title: 'HelixPlot', text: code, url });
            return true;
        } catch {
            // User cancelled or not supported
        }
    }

    return copyToClipboard(url);
}

/** Parse share URL params */
export function parseShareURL(): { code?: string; latex?: string } | null {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('expr');
    if (!code) return null;
    return { code, latex: params.get('latex') ?? undefined };
}

/** Copy text to clipboard */
export async function copyToClipboard(text: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textarea);
        return success;
    }
}
