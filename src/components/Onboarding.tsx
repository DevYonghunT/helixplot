import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/useAppStore';

interface Step {
    titleKey: string;
    descKey: string;
    icon: string;
}

const STEPS: Step[] = [
    { titleKey: 'onboarding.step1_title', descKey: 'onboarding.step1_desc', icon: '📐' },
    { titleKey: 'onboarding.step2_title', descKey: 'onboarding.step2_desc', icon: '✏️' },
    { titleKey: 'onboarding.step3_title', descKey: 'onboarding.step3_desc', icon: '🎨' },
    { titleKey: 'onboarding.step4_title', descKey: 'onboarding.step4_desc', icon: '▶️' },
];

export function Onboarding() {
    const { t } = useTranslation();
    const hasSeenOnboarding = useAppStore(s => s.hasSeenOnboarding);
    const setHasSeenOnboarding = useAppStore(s => s.setHasSeenOnboarding);
    const [step, setStep] = useState(0);

    const dismiss = useCallback(() => {
        setHasSeenOnboarding(true);
    }, [setHasSeenOnboarding]);

    const next = useCallback(() => {
        if (step < STEPS.length - 1) {
            setStep(s => s + 1);
        } else {
            dismiss();
        }
    }, [step, dismiss]);

    const prev = useCallback(() => {
        if (step > 0) setStep(s => s - 1);
    }, [step]);

    if (hasSeenOnboarding) return null;

    const current = STEPS[step];
    const isLast = step === STEPS.length - 1;

    return (
        <div
            className="fixed inset-0 z-[9998] flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
            role="dialog"
            aria-modal="true"
            aria-label={t('onboarding.title')}
        >
            <div
                className="relative w-[90vw] max-w-md rounded-3xl border border-[var(--border)] shadow-2xl overflow-hidden"
                style={{ background: 'var(--bg-surface)', color: 'var(--text)' }}
            >
                {/* Skip button */}
                <button
                    onClick={dismiss}
                    className="absolute top-4 right-4 text-sm px-3 py-1 rounded-full transition-colors"
                    style={{ color: 'var(--muted)', background: 'var(--bg-button)' }}
                    aria-label={t('onboarding.skip')}
                >
                    {t('onboarding.skip')}
                </button>

                {/* Content */}
                <div className="px-8 pt-12 pb-6 flex flex-col items-center text-center">
                    <div
                        className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mb-6"
                        style={{ background: 'var(--bg-button-active)' }}
                    >
                        {current.icon}
                    </div>

                    <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--text)' }}>
                        {t(current.titleKey)}
                    </h2>
                    <p className="text-sm leading-relaxed mb-8" style={{ color: 'var(--muted)' }}>
                        {t(current.descKey)}
                    </p>

                    {/* Step indicators */}
                    <div className="flex gap-2 mb-6">
                        {STEPS.map((_, i) => (
                            <div
                                key={i}
                                className="h-1.5 rounded-full transition-all duration-300"
                                style={{
                                    width: i === step ? 24 : 8,
                                    background: i === step ? 'var(--accent)' : 'var(--border)',
                                }}
                            />
                        ))}
                    </div>
                </div>

                {/* Navigation buttons */}
                <div
                    className="flex gap-3 px-8 pb-8"
                    style={{ justifyContent: step === 0 ? 'flex-end' : 'space-between' }}
                >
                    {step > 0 && (
                        <button
                            onClick={prev}
                            className="px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
                            style={{ color: 'var(--muted)', background: 'var(--bg-button)' }}
                        >
                            {t('onboarding.prev')}
                        </button>
                    )}
                    <button
                        onClick={next}
                        className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
                        style={{ background: 'var(--accent)' }}
                    >
                        {isLast ? t('onboarding.start') : t('onboarding.next')}
                    </button>
                </div>
            </div>
        </div>
    );
}
