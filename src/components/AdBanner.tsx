import { useEffect, useRef, useState } from 'react';
import { AdService } from '../services/AdService';

interface AdBannerProps {
    /** Banner size: 'leaderboard' (728x90) or 'mobile' (320x50) */
    size?: 'leaderboard' | 'mobile';
    /** Additional CSS classes */
    className?: string;
}

/**
 * AdBanner - Responsive ad banner component
 *
 * - Desktop: 728x90 leaderboard below PlaybackBar
 * - Mobile: 320x50 banner above MobileSheet
 * - Falls back gracefully if ads fail to load
 * - Hidden during editing (respects noAdsDuringEditing policy)
 */
export function AdBanner({ size = 'leaderboard', className = '' }: AdBannerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (AdService.isNativePlatform) {
            // Native ads handled by AdService directly
            AdService.showBanner().then(() => setLoaded(true)).catch(() => setError(true));
            return () => { AdService.hideBanner(); };
        }

        // Web: AdSense via script tag
        const config = AdService.getAdSenseConfig();
        if (!config.publisherId || config.publisherId.includes('XXXX')) {
            // Placeholder IDs — skip loading
            return;
        }

        try {
            // Load AdSense script if not already present
            if (!document.querySelector('script[src*="adsbygoogle"]')) {
                const script = document.createElement('script');
                script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${config.publisherId}`;
                script.async = true;
                script.crossOrigin = 'anonymous';
                script.onerror = () => setError(true);
                document.head.appendChild(script);
            }

            // Push ad unit
            const timer = setTimeout(() => {
                try {
                    ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
                    setLoaded(true);
                } catch {
                    setError(true);
                }
            }, 1000);

            return () => clearTimeout(timer);
        } catch {
            setError(true);
        }
    }, []);

    // Don't render anything if ads fail or are not configured
    if (error || AdService.isNativePlatform) return null;

    const dimensions = size === 'mobile'
        ? { width: 320, height: 50 }
        : { width: 728, height: 90 };

    const config = AdService.getAdSenseConfig();

    // Don't render placeholder if not configured
    if (config.publisherId.includes('XXXX')) {
        return null;
    }

    return (
        <div
            ref={containerRef}
            className={`flex items-center justify-center overflow-hidden ${className}`}
            style={{
                minHeight: loaded ? dimensions.height : 0,
                transition: 'min-height 0.3s ease',
            }}
            aria-hidden="true"
        >
            <ins
                className="adsbygoogle"
                style={{
                    display: loaded ? 'block' : 'none',
                    width: dimensions.width,
                    height: dimensions.height,
                }}
                data-ad-client={config.publisherId}
                data-ad-slot={config.slotId}
                data-ad-format="auto"
                data-full-width-responsive="true"
            />
        </div>
    );
}
