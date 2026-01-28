/**
 * Ad Service - Platform-agnostic ad management
 *
 * Supports:
 * - Web: Google AdSense (via script injection)
 * - Native: AdMob via Capacitor plugin (when available)
 *
 * Configuration:
 * - Banner ads: shown below playback bar (desktop) or above mobile sheet
 * - Interstitial ads: triggered on preset changes (every 3rd change, max 3/session)
 * - Respects cooldown periods and user experience
 */

import { Capacitor } from '@capacitor/core';

// ─── Configuration ───────────────────────────────────────────

export interface AdConfig {
    // AdSense IDs (web)
    adsensePublisherId: string;
    adsenseBannerSlot: string;

    // AdMob IDs (native)
    admobBannerId: {
        ios: string;
        android: string;
    };
    admobInterstitialId: {
        ios: string;
        android: string;
    };

    // Policy
    interstitialEveryN: number;       // Show interstitial every N preset changes
    interstitialMaxPerSession: number; // Max interstitials per session
    interstitialCooldownMs: number;    // Min time between interstitials
    noAdsOnFirstLaunch: boolean;       // Skip ads on first session
    noAdsDuringEditing: boolean;       // Don't show during active editing
}

const DEFAULT_CONFIG: AdConfig = {
    adsensePublisherId: 'ca-pub-XXXXXXXXXXXXXXXX', // Replace with actual ID
    adsenseBannerSlot: 'XXXXXXXXXX',

    admobBannerId: {
        ios: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
        android: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
    },
    admobInterstitialId: {
        ios: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
        android: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
    },

    interstitialEveryN: 3,
    interstitialMaxPerSession: 3,
    interstitialCooldownMs: 60_000,  // 60 seconds minimum between ads
    noAdsOnFirstLaunch: true,
    noAdsDuringEditing: true,
};

// ─── Ad Service ──────────────────────────────────────────────

class AdServiceImpl {
    private config: AdConfig;
    private interstitialCount = 0;
    private lastInterstitialAt = 0;
    private isNative: boolean;
    private initialized = false;
    private admobPlugin: any = null;

    constructor(config: Partial<AdConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.isNative = Capacitor.isNativePlatform();
    }

    /** Initialize ad SDKs */
    async initialize(): Promise<void> {
        if (this.initialized) return;

        try {
            if (this.isNative) {
                await this.initNativeAds();
            } else {
                this.initWebAds();
            }
            this.initialized = true;
        } catch (err) {
            console.warn('[AdService] Failed to initialize:', err);
        }
    }

    /** Check if we're running on native platform */
    get isNativePlatform(): boolean {
        return this.isNative;
    }

    /** Check if ads are currently enabled */
    get adsEnabled(): boolean {
        // Could check premium status, consent, etc.
        return this.initialized;
    }

    // ─── Banner Ads ──────────────────────────────────────────

    /** Get the AdSense publisher ID for web banner rendering */
    getAdSenseConfig() {
        return {
            publisherId: this.config.adsensePublisherId,
            slotId: this.config.adsenseBannerSlot,
        };
    }

    /** Show native banner ad */
    async showBanner(): Promise<void> {
        if (!this.isNative || !this.admobPlugin) return;

        try {
            const platform = Capacitor.getPlatform();
            const adId = platform === 'ios'
                ? this.config.admobBannerId.ios
                : this.config.admobBannerId.android;

            await this.admobPlugin.showBanner({
                adId,
                position: 'BOTTOM_CENTER',
                margin: 0,
                isTesting: __DEV__,
            });
        } catch (err) {
            console.warn('[AdService] Banner show failed:', err);
        }
    }

    /** Hide native banner ad */
    async hideBanner(): Promise<void> {
        if (!this.isNative || !this.admobPlugin) return;
        try {
            await this.admobPlugin.hideBanner();
        } catch {
            // Ignore
        }
    }

    // ─── Interstitial Ads ────────────────────────────────────

    /** Check if interstitial should be shown based on policy */
    shouldShowInterstitial(presetChangeCount: number, hasSeenOnboarding: boolean): boolean {
        // Respect first-launch policy
        if (this.config.noAdsOnFirstLaunch && !hasSeenOnboarding) return false;

        // Respect session max
        if (this.interstitialCount >= this.config.interstitialMaxPerSession) return false;

        // Respect cooldown
        const now = Date.now();
        if (now - this.lastInterstitialAt < this.config.interstitialCooldownMs) return false;

        // Check frequency
        if (presetChangeCount % this.config.interstitialEveryN !== 0) return false;
        if (presetChangeCount === 0) return false;

        return true;
    }

    /** Show interstitial ad */
    async showInterstitial(): Promise<boolean> {
        try {
            if (this.isNative && this.admobPlugin) {
                const platform = Capacitor.getPlatform();
                const adId = platform === 'ios'
                    ? this.config.admobInterstitialId.ios
                    : this.config.admobInterstitialId.android;

                await this.admobPlugin.prepareInterstitial({
                    adId,
                    isTesting: __DEV__,
                });
                await this.admobPlugin.showInterstitial();
            }
            // Web interstitials could be implemented via AdSense auto-ads
            // or a custom modal-based approach

            this.interstitialCount++;
            this.lastInterstitialAt = Date.now();
            return true;
        } catch (err) {
            console.warn('[AdService] Interstitial failed:', err);
            return false;
        }
    }

    // ─── Private Methods ─────────────────────────────────────

    private async initNativeAds(): Promise<void> {
        try {
            // Dynamic import to avoid bundling native plugin on web
            // Use string variable to prevent TypeScript static resolution
            const admobModule = '@capacitor-community/admob';
            const mod = await import(/* @vite-ignore */ admobModule).catch(() => null);
            if (mod?.AdMob) {
                this.admobPlugin = mod.AdMob;
                await this.admobPlugin.initialize({
                    initializeForTesting: __DEV__,
                });
            }
        } catch {
            console.warn('[AdService] AdMob plugin not available');
        }
    }

    private initWebAds(): void {
        // AdSense is loaded via script tag, handled by AdBanner component
        // No additional initialization needed here
    }
}

// Detect dev mode
const __DEV__ = import.meta.env.DEV;

// Singleton export
export const AdService = new AdServiceImpl();
