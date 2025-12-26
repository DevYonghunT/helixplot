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
            if (!readOnly) window.mathVirtualKeyboard.show();

            if (onFocused) onFocused();
        };

        mf.addEventListener('input', handleInput);
        mf.addEventListener('focus', handleFocus);

        return () => {
            mf.removeEventListener('input', handleInput);
            mf.removeEventListener('focus', handleFocus);
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
                display: 'block'
            }}
            read-only={readOnly ? true : undefined}
        />
    );
});
MathLiveInput.displayName = "MathLiveInput";
