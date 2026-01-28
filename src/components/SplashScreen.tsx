import { useState, useEffect, useCallback } from 'react';
import { AdService } from '../services/AdService';

interface SplashScreenProps {
    onComplete: () => void;
}

/** Minimum time the splash is visible (ms) before ad can appear */
const BRANDING_DURATION = 2000;
/** Time to wait for ad to load before skipping (ms) */
const AD_TIMEOUT = 5000;
/** Fade-out animation duration (ms) */
const FADE_DURATION = 400;

/**
 * SplashScreen - Full-screen launch screen with interstitial ad
 *
 * Flow:
 * 1. Show branding for BRANDING_DURATION
 * 2. Initialize AdService and attempt interstitial ad
 * 3. If ad shows: wait for it to complete, then fade out
 * 4. If ad fails/unavailable: fade out after timeout
 */
export function SplashScreen({ onComplete }: SplashScreenProps) {
    const [phase, setPhase] = useState<'branding' | 'ad' | 'fadeout' | 'done'>('branding');
    const [opacity, setOpacity] = useState(1);

    const fadeAndComplete = useCallback(() => {
        setPhase('fadeout');
        setOpacity(0);
        setTimeout(() => {
            setPhase('done');
            onComplete();
        }, FADE_DURATION);
    }, [onComplete]);

    // Phase 1: Branding → Phase 2: Ad
    useEffect(() => {
        const timer = setTimeout(() => {
            setPhase('ad');
        }, BRANDING_DURATION);
        return () => clearTimeout(timer);
    }, []);

    // Phase 2: Try interstitial ad, then fade out
    useEffect(() => {
        if (phase !== 'ad') return;

        let completed = false;

        const tryAd = async () => {
            try {
                await AdService.initialize();

                // Attempt interstitial ad (native only for splash)
                if (AdService.isNativePlatform && AdService.adsEnabled) {
                    const shown = await AdService.showInterstitial();
                    if (shown && !completed) {
                        completed = true;
                        fadeAndComplete();
                        return;
                    }
                }
            } catch {
                // Ad failed, proceed anyway
            }

            // If ad didn't show (web or failed), finish after brief delay
            if (!completed) {
                completed = true;
                fadeAndComplete();
            }
        };

        tryAd();

        // Safety timeout: always complete eventually
        const safetyTimer = setTimeout(() => {
            if (!completed) {
                completed = true;
                fadeAndComplete();
            }
        }, AD_TIMEOUT);

        return () => clearTimeout(safetyTimer);
    }, [phase, fadeAndComplete]);

    if (phase === 'done') return null;

    return (
        <div
            className="fixed inset-0 z-[99999] flex flex-col items-center justify-center"
            style={{
                background: '#0b0f17',
                opacity,
                transition: `opacity ${FADE_DURATION}ms ease-out`,
                pointerEvents: phase === 'fadeout' ? 'none' : 'auto',
            }}
        >
            {/* Logo / Branding */}
            <div className="flex flex-col items-center gap-6">
                {/* App icon placeholder - animated helix */}
                <div
                    className="w-24 h-24 rounded-3xl flex items-center justify-center"
                    style={{
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%)',
                        boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4)',
                    }}
                >
                    <svg
                        width="56"
                        height="56"
                        viewBox="0 0 56 56"
                        fill="none"
                        style={{
                            animation: phase === 'branding' ? 'splash-spin 2s ease-in-out' : undefined,
                        }}
                    >
                        {/* Helix-inspired logo: intertwined curves */}
                        <path
                            d="M10 46C10 46 18 10 28 10C38 10 46 46 46 46"
                            stroke="white"
                            strokeWidth="3"
                            strokeLinecap="round"
                            fill="none"
                            opacity="0.9"
                        />
                        <path
                            d="M10 10C10 10 18 46 28 46C38 46 46 10 46 10"
                            stroke="white"
                            strokeWidth="3"
                            strokeLinecap="round"
                            fill="none"
                            opacity="0.5"
                        />
                        <circle cx="28" cy="28" r="4" fill="white" opacity="0.9" />
                    </svg>
                </div>

                {/* App name */}
                <div className="text-center">
                    <h1
                        className="text-3xl font-bold tracking-tight"
                        style={{ color: '#e5e7eb' }}
                    >
                        HelixPlot
                    </h1>
                    <p
                        className="text-sm mt-2 tracking-wide"
                        style={{ color: 'rgba(229, 231, 235, 0.5)' }}
                    >
                        3D Math Visualizer
                    </p>
                </div>

                {/* Loading indicator during ad phase */}
                {phase === 'ad' && (
                    <div className="mt-8 flex gap-1.5">
                        {[0, 1, 2].map(i => (
                            <div
                                key={i}
                                className="w-2 h-2 rounded-full"
                                style={{
                                    background: 'rgba(99, 102, 241, 0.8)',
                                    animation: `splash-pulse 1s ease-in-out ${i * 0.15}s infinite`,
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Ad container slot for web interstitial */}
            {phase === 'ad' && !AdService.isNativePlatform && (
                <SplashAdSlot />
            )}

            {/* Inline keyframes */}
            <style>{`
                @keyframes splash-spin {
                    0% { transform: rotate(0deg) scale(0.8); opacity: 0; }
                    30% { opacity: 1; }
                    100% { transform: rotate(360deg) scale(1); opacity: 1; }
                }
                @keyframes splash-pulse {
                    0%, 100% { opacity: 0.3; transform: scale(0.8); }
                    50% { opacity: 1; transform: scale(1.2); }
                }
            `}</style>
        </div>
    );
}

/**
 * Web interstitial ad slot displayed during splash.
 * Uses AdSense or a placeholder for web builds.
 */
function SplashAdSlot() {
    const [loaded, setLoaded] = useState(false);
    const config = AdService.getAdSenseConfig();

    useEffect(() => {
        if (config.publisherId.includes('XXXX')) return;

        try {
            if (!document.querySelector('script[src*="adsbygoogle"]')) {
                const script = document.createElement('script');
                script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${config.publisherId}`;
                script.async = true;
                script.crossOrigin = 'anonymous';
                document.head.appendChild(script);
            }

            const timer = setTimeout(() => {
                try {
                    ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
                    setLoaded(true);
                } catch {
                    // Ad push failed
                }
            }, 500);

            return () => clearTimeout(timer);
        } catch {
            // Ad init failed
        }
    }, [config.publisherId]);

    // Don't render ad container if not configured
    if (config.publisherId.includes('XXXX')) return null;

    return (
        <div
            className="mt-8 flex items-center justify-center"
            style={{
                minWidth: 300,
                minHeight: loaded ? 250 : 0,
                transition: 'min-height 0.3s ease',
            }}
        >
            <ins
                className="adsbygoogle"
                style={{
                    display: loaded ? 'block' : 'none',
                    width: 300,
                    height: 250,
                }}
                data-ad-client={config.publisherId}
                data-ad-slot={config.slotId}
                data-ad-format="auto"
            />
        </div>
    );
}
