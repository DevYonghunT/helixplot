/**
 * Export utilities for HelixPlot
 * - PNG screenshot from Three.js canvas
 * - Share URL with encoded expression
 * - Clipboard copy
 */

/** Capture the active Three.js canvas as a PNG data-URL */
export function captureCanvasPNG(): string | null {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    if (!canvas) return null;
    return canvas.toDataURL('image/png');
}

/** Download a data-URL as a file */
export function downloadDataURL(dataURL: string, filename: string) {
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

/** Build a share URL with the current expression encoded as a query param */
export function buildShareURL(code: string, latex?: string): string {
    const base = window.location.origin + window.location.pathname;
    const params = new URLSearchParams();
    params.set('expr', code);
    if (latex) params.set('latex', latex);
    return `${base}?${params.toString()}`;
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
