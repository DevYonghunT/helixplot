import { useEffect, useRef } from 'react';
import { MathfieldElement } from 'mathlive';

interface MathLiveInputProps {
    valueLatex: string;
    onChangeLatex: (latex: string) => void;
    dockRef?: React.RefObject<HTMLDivElement | null>;
    autoFocus?: boolean;
    readOnly?: boolean;
    onFocused?: () => void;
}

export function MathLiveInput({
    valueLatex,
    onChangeLatex,
    dockRef,
    autoFocus,
    readOnly,
    onFocused
}: MathLiveInputProps) {
    const mfRef = useRef<MathfieldElement>(null);

    // Initial value & event listeners
    useEffect(() => {
        const mf = mfRef.current;
        if (!mf) return;

        // Settings to minimize native keyboard and dock virtual keyboard
        // @ts-ignore
        mf.mathVirtualKeyboardPolicy = "manual"; // or something to control it?
        // Actually MathLive 0.98+ uses window.mathVirtualKeyboard

        // Native keyboard suppression
        // @ts-ignore
        mf.setAttribute('inputmode', 'none');

        const handleInput = (e: Event) => {
            const val = (e.target as MathfieldElement).value;
            if (val !== valueLatex) {
                onChangeLatex(val);
            }
        };

        const handleFocus = () => {
            // Docking logic
            const dock = dockRef?.current;
            if (dock) {
                // @ts-ignore
                window.mathVirtualKeyboard.container = dock;
            }
            // Show keyboard
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
    }, [onChangeLatex, dockRef, readOnly]);

    // Sync value from props
    useEffect(() => {
        const mf = mfRef.current;
        if (mf && mf.value !== valueLatex) {
            mf.value = valueLatex;
        }
    }, [valueLatex]);

    // Autofocus
    useEffect(() => {
        if (autoFocus) {
            setTimeout(() => {
                mfRef.current?.focus();
            }, 300); // 300ms delay for portal mount
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
        >
            {valueLatex}
            {/* @ts-ignore */}
        </math-field>
    );
}
