import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { MathfieldElement } from 'mathlive';

// Defined Handle type for parent ref
export interface MathLiveInputHandle {
    insertLatex: (template: string) => void;
    focus: () => void;
    element: MathfieldElement | null;
}

interface MathLiveInputProps {
    valueLatex: string;
    onChangeLatex: (latex: string) => void;
    dockRef?: React.RefObject<HTMLDivElement | null>;
    autoFocus?: boolean;
    readOnly?: boolean;
    onFocused?: () => void;
}

export const MathLiveInput = forwardRef<MathLiveInputHandle, MathLiveInputProps>(({
    valueLatex,
    onChangeLatex,
    dockRef,
    autoFocus,
    readOnly,
    onFocused
}, ref) => {
    const mfRef = useRef<MathfieldElement | null>(null);

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
        insertLatex: (template: string) => {
            const mf = mfRef.current;
            if (!mf) return;
            // Force focus then insert
            // @ts-ignore
            mf.focus();
            mf.executeCommand(['insert', template, { format: 'latex' }]);
        },
        focus: () => {
            // @ts-ignore
            mfRef.current?.focus();
        },
        get element() {
            return mfRef.current;
        }
    }));

    // Initial value & event listeners
    useEffect(() => {
        const mf = mfRef.current;
        if (!mf) return;

        // Apply basic settings
        // @ts-ignore
        mf.smartMode = true;
        // @ts-ignore
        mf.mathVirtualKeyboardPolicy = 'manual';

        const applyMultilineStyles = () => {
            const shadow = mf.shadowRoot;
            if (!shadow) return;

            const container = shadow.querySelector('.ML__container') as HTMLElement | null;
            const content = shadow.querySelector('.ML__content') as HTMLElement | null;

            if (container) {
                container.style.alignItems = 'flex-start';
                container.style.flexWrap = 'wrap';
            }

            if (content) {
                content.style.flexWrap = 'wrap';
                content.style.whiteSpace = 'normal';
                content.style.overflow = 'visible';
            }
        };

        applyMultilineStyles();
        const observer = new MutationObserver(() => applyMultilineStyles());
        if (mf.shadowRoot) {
            observer.observe(mf.shadowRoot, { childList: true, subtree: true });
        }

        const handleInput = (e: Event) => {
            const val = (e.target as MathfieldElement).value;
            if (val !== valueLatex) {
                onChangeLatex(val);
            }
        };

        const handleFocus = () => {
            const dock = dockRef?.current;
            if (dock) {
                // @ts-ignore
                window.mathVirtualKeyboard.container = dock;
            }
            // @ts-ignore
            if (!readOnly) window.mathVirtualKeyboard.show({ animate: false });

            if (onFocused) onFocused();
        };

        mf.addEventListener('input', handleInput);
        mf.addEventListener('focus', handleFocus);

        return () => {
            mf.removeEventListener('input', handleInput);
            mf.removeEventListener('focus', handleFocus);
            observer.disconnect();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [onChangeLatex, readOnly]); // dockRef removed from dependency

    // Sync value from props (One-way)
    useEffect(() => {
        const mf = mfRef.current;
        if (mf && mf.value !== valueLatex) {
            mf.value = valueLatex;
        }
    }, [valueLatex]);

    useEffect(() => {
        if (!dockRef?.current) return;
        // @ts-ignore
        const keyboard = window.mathVirtualKeyboard;
        if (!keyboard) return;
        // @ts-ignore
        keyboard.container = dockRef.current;
        keyboard.connect?.();
        if (!readOnly) {
            keyboard.show({ animate: false });
        }
    }, [dockRef, readOnly]);

    // Autofocus
    useEffect(() => {
        if (autoFocus) {
            requestAnimationFrame(() => {
                // @ts-ignore
                mfRef.current?.focus();
            });
        }
    }, [autoFocus]);

    return (
        // @ts-ignore
        <math-field
            ref={mfRef}
            style={{
                width: '100%',
                fontSize: '24px',
                outline: 'none',
                border: 'none',
                background: 'transparent',
                display: 'block',
                height: 'auto',
                lineHeight: '1.4'
            }}
            read-only={readOnly ? true : undefined}
        />
    );
});
MathLiveInput.displayName = "MathLiveInput";
