import { useState, useEffect, useRef, useCallback } from 'react';
import { ExpressionParser } from '../core/ExpressionParser';
import { ModeDetector } from '../core/ModeDetector';
import { Sampler } from '../core/Sampler';
import { Evaluator } from '../core/Evaluator';
import type { RenderConfig, SampleResult, DefinitionsMap } from '../core/types';
import { latexToExpr } from '../utils/latexToExpr';
import { useMathWorker } from './useMathWorker';

const INITIAL_CODE = `# Lissajous / Complex Demo
f(t) = exp(-0.1*t) * (cos(5*t) + i*sin(5*t))
tmin = 0
tmax = 10
`;

const DEBOUNCE_MS = 300;

export function useHelixState() {
    const [input, setInput] = useState(INITIAL_CODE);
    const [latexInput, setLatexInput] = useState("");
    const [lastGoodExpr, setLastGoodExpr] = useState("");
    const [exprError, setExprError] = useState<string | null>(null);

    const [parsed, setParsed] = useState<{ defs: DefinitionsMap, errors: string[] }>({ defs: {}, errors: [] });
    const [data, setData] = useState<SampleResult>({ points: [], validity: [] });
    const [config, setConfig] = useState<RenderConfig>({ mode: 'auto', tRange: [0, 10], tSamples: 800 });
    const revisionRef = useRef(0);
    const [sampling, setSampling] = useState(false);

    const [userPeriodT, setUserPeriodT] = useState<string>("");
    const [detectedParams, setDetectedParams] = useState<Record<string, number>>({});

    // Worker proxy (singleton via useMathWorker)
    const workerProxy = useMathWorker();

    // Helper: Update Code from LaTeX
    const updateFromLatex = useCallback((latex: string) => {
        setLatexInput(latex);
        const { expr, error } = latexToExpr(latex);

        if (error) {
            setExprError(error);
            return;
        }

        setInput(prev => {
            const lines = prev.split('\n');
            const fIdx = lines.findIndex(l => l.trim().startsWith('f(t) =') || l.trim().startsWith('f(t)='));

            if (fIdx !== -1) {
                const newLines = [...lines];
                newLines[fIdx] = `f(t) = ${expr}`;
                return newLines.join('\n');
            }
            return prev;
        });

        setLastGoodExpr(expr);
        setExprError(null);
    }, []);

    // 1. Parse Input Effect (debounced) — runs on main thread (fast)
    useEffect(() => {
        const timer = setTimeout(() => {
            const { definitions, errors } = ExpressionParser.parse(input);
            const detMode = ModeDetector.detect(definitions);

            const ev = new Evaluator({});
            const constants: Record<string, number> = {};
            Object.values(definitions).forEach(d => {
                if (d.params.length === 0) {
                    try {
                        const val = ev.evaluate(d.expr);
                        if (typeof val === 'number') {
                            constants[d.target] = val;
                        }
                    } catch {
                        // Skip invalid constant expressions
                    }
                }
            });

            // Detect embedded period
            if (typeof constants['period'] === 'number') setUserPeriodT(String(constants['period']));
            else if (typeof constants['T'] === 'number') setUserPeriodT(String(constants['T']));
            else if (typeof constants['Period'] === 'number') setUserPeriodT(String(constants['Period']));
            else setUserPeriodT("");

            let tmin = 0, tmax = 10;
            if (typeof constants['tmin'] === 'number') tmin = constants['tmin'];
            if (typeof constants['tmax'] === 'number') tmax = constants['tmax'];

            const newConfig: RenderConfig = {
                mode: detMode,
                tRange: [tmin, tmax],
                tSamples: 800,
                xRange: [
                    typeof constants['xmin'] === 'number' ? constants['xmin'] : -Math.PI,
                    typeof constants['xmax'] === 'number' ? constants['xmax'] : Math.PI
                ],
                yRange: [
                    typeof constants['ymin'] === 'number' ? constants['ymin'] : -Math.PI,
                    typeof constants['ymax'] === 'number' ? constants['ymax'] : Math.PI
                ]
            };

            // Expose user-defined parameters (exclude reserved names)
            const RESERVED = new Set(['tmin', 'tmax', 'xmin', 'xmax', 'ymin', 'ymax', 'period', 'T', 'Period']);
            const userParams: Record<string, number> = {};
            for (const [key, val] of Object.entries(constants)) {
                if (!RESERVED.has(key)) userParams[key] = val;
            }
            setDetectedParams(userParams);

            setParsed({ defs: definitions, errors });
            setConfig(newConfig);
        }, DEBOUNCE_MS);

        return () => clearTimeout(timer);
    }, [input]);

    // 2. Sample Data Effect — offload to Web Worker with main-thread fallback
    useEffect(() => {
        if (Object.keys(parsed.defs).length === 0) return;

        let cancelled = false;
        setSampling(true);

        const sampleAsync = async () => {
            try {
                if (workerProxy) {
                    // Attempt Worker sampling
                    const result = await workerProxy.sample(parsed.defs, config);
                    if (!cancelled) {
                        revisionRef.current += 1;
                        setData({ ...result, revision: revisionRef.current });
                    }
                } else {
                    throw new Error('Worker unavailable');
                }
            } catch {
                // Fallback to main thread
                if (!cancelled) {
                    const result = Sampler.sample(parsed.defs, config);
                    revisionRef.current += 1;
                    setData({ ...result, revision: revisionRef.current });
                }
            } finally {
                if (!cancelled) setSampling(false);
            }
        };

        sampleAsync();

        return () => { cancelled = true; };
    }, [parsed.defs, config, workerProxy]);

    // Update a single parameter value in the input code
    const updateParam = useCallback((name: string, value: number) => {
        setInput(prev => {
            const lines = prev.split('\n');
            const idx = lines.findIndex(l => {
                const trimmed = l.trim();
                return trimmed.startsWith(`${name} =`) || trimmed.startsWith(`${name}=`);
            });
            if (idx !== -1) {
                const newLines = [...lines];
                // Format number: avoid trailing zeros for clean display
                const formatted = Number.isInteger(value) ? value.toString() : parseFloat(value.toFixed(6)).toString();
                newLines[idx] = `${name} = ${formatted}`;
                return newLines.join('\n');
            }
            return prev;
        });
    }, []);

    return {
        input, setInput,
        latexInput, updateFromLatex, setLatexInputRaw: setLatexInput,
        lastGoodExpr,
        exprError,
        errors: parsed.errors,
        data,
        config,
        userPeriodT,
        detectedParams,
        updateParam,
        sampling,
    };
}
