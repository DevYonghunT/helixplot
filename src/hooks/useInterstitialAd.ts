import { useEffect, useRef } from 'react';
import { AdService } from '../services/AdService';
import { useAppStore } from '../store/useAppStore';

/**
 * Hook to manage interstitial ad display based on app state.
 * Shows interstitial after every N preset changes (configurable in AdService).
 *
 * Rules:
 * - No ads during first session (onboarding protection)
 * - Max 3 interstitials per session
 * - Minimum 60s cooldown between ads
 * - Never during editing or playback
 */
export function useInterstitialAd() {
    const presetChangeCount = useAppStore(s => s.presetChangeCount);
    const hasSeenOnboarding = useAppStore(s => s.hasSeenOnboarding);
    const setLastAdShownAt = useAppStore(s => s.setLastAdShownAt);
    const prevCount = useRef(presetChangeCount);

    useEffect(() => {
        // Only trigger on actual preset change (not mount)
        if (presetChangeCount === prevCount.current) return;
        prevCount.current = presetChangeCount;

        if (AdService.shouldShowInterstitial(presetChangeCount, hasSeenOnboarding)) {
            // Small delay to not interrupt preset transition
            const timer = setTimeout(() => {
                AdService.showInterstitial().then((shown) => {
                    if (shown) {
                        setLastAdShownAt(Date.now());
                    }
                });
            }, 500);

            return () => clearTimeout(timer);
        }
    }, [presetChangeCount, hasSeenOnboarding, setLastAdShownAt]);
}
