import React from 'react';
import i18n from '../i18n';

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    onReset?: () => void;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('[HelixPlot] Render error:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
        this.props.onReset?.();
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;

            return (
                <div className="flex flex-col items-center justify-center h-full w-full gap-4 p-6 text-center">
                    <div className="text-4xl">!</div>
                    <h2 className="text-lg font-bold text-[var(--text)]">
                        {i18n.t('error.title')}
                    </h2>
                    <p className="text-sm text-[var(--muted)] max-w-xs">
                        {this.state.error?.message || i18n.t('error.message')}
                    </p>
                    <button
                        onClick={this.handleReset}
                        className="px-5 py-2 bg-[var(--accent)] text-white rounded-xl text-sm font-semibold active:scale-95 transition-transform"
                    >
                        {i18n.t('error.retry')}
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

/** Lightweight boundary specifically for Three.js Canvas errors */
export class CanvasErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean }
> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(): { hasError: boolean } {
        return { hasError: true };
    }

    componentDidCatch(error: Error) {
        console.error('[HelixPlot] Canvas error:', error);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex items-center justify-center h-full w-full bg-[var(--card)] rounded-2xl">
                    <div className="text-center p-4">
                        <p className="text-sm text-[var(--muted)]">{i18n.t('error.canvas_error')}</p>
                        <button
                            onClick={() => this.setState({ hasError: false })}
                            className="mt-2 px-4 py-1.5 bg-[var(--accent)] text-white rounded-lg text-xs font-semibold"
                        >
                            {i18n.t('error.retry')}
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
