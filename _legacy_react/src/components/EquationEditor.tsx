import { useEffect, useRef } from 'react';
import 'mathlive';

// Note: math-field is a custom element. We ignore TS check for it.

// Redefine MathInput to be smarter
function SmartMathInput({ label, initialExpr, onExprChange }: { label: string, initialExpr: string, onExprChange: (expr: string) => void }) {
    const mf = useRef<any>(null);

    useEffect(() => {
        if (mf.current) {
            // Set initial value. 
            mf.current.value = initialExpr;
        }
    }, []);

    useEffect(() => {
        const el = mf.current;
        if (!el) return;

        // Listen to changes
        const onInput = () => {
            // Get ASCII Math
            const ascii = el.getValue('ascii-math');
            onExprChange(ascii);
        };
        el.addEventListener('input', onInput);
        return () => el.removeEventListener('input', onInput);
    }, [onExprChange]);

    return (
        <div className="flex flex-col gap-1">
            <div className="flex justify-between items-end">
                <label className="text-xs font-bold text-[var(--muted)] uppercase font-mono">{label}</label>
            </div>
            <div className="border border-[var(--border)] rounded-xl overflow-hidden bg-white text-black shadow-sm">
                {/* @ts-ignore */}
                <math-field
                    ref={mf}
                    style={{
                        width: '100%',
                        padding: '12px',
                        fontSize: '18px',
                        border: 'none',
                        outline: 'none',
                        backgroundColor: 'white' // MathLive needs light bg usually
                    }}
                >
                    {initialExpr}
                    {/* @ts-ignore */}
                </math-field>
            </div>
        </div>
    );
}

export function EquationEditorPanel({ code, onCodeChange }: { code: string, onCodeChange: (c: string) => void }) {
    // Parse initial
    const lines = code.split('\n');
    const findDef = (target: string) => {
        const line = lines.find(l => l.trim().startsWith(target));
        if (line) {
            const parts = line.split('=');
            if (parts.length > 1) return parts[1].trim();
        }
        return 't'; // default
    };

    const xInit = findDef('x(t)');
    const yInit = findDef('y(t)');
    const zInit = findDef('z(t)');

    const handleExprChange = (axis: 'x' | 'y' | 'z', val: string) => {
        let c = code;
        const setLine = (t: string, v: string) => {
            const reg = new RegExp(`(${t.replace('(', '\\(').replace(')', '\\)')}\\s*=\\s*)(.*)`);
            if (reg.test(c)) {
                c = c.replace(reg, `$1${v}`);
            } else {
                c += `\n${t} = ${v}`;
            }
        };

        setLine(axis === 'x' ? 'x(t)' : axis === 'y' ? 'y(t)' : 'z(t)', val);

        onCodeChange(c);
    };

    return (
        <div className="flex flex-col gap-6 p-4 h-full overflow-y-auto">
            <SmartMathInput label="x(t)" initialExpr={xInit} onExprChange={v => handleExprChange('x', v)} />
            <SmartMathInput label="y(t)" initialExpr={yInit} onExprChange={v => handleExprChange('y', v)} />
            <SmartMathInput label="z(t)" initialExpr={zInit} onExprChange={v => handleExprChange('z', v)} />

            <div className="p-3 bg-[var(--card)] rounded-xl border border-[var(--border)] text-xs text-[var(--muted)]">
                <p className="mb-1">💡 Tips:</p>
                <ul className="list-disc list-inside space-y-0.5">
                    <li>Type <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">/</code> for fractions</li>
                    <li>Type <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">^</code> for powers</li>
                    <li>Functions: sin, cos, tan, log, exp</li>
                    <li>Constants: pi</li>
                </ul>
            </div>
        </div>
    );
}
