import { useState, useEffect } from 'react';
import { ExpressionParser } from '../core/ExpressionParser';
import { ModeDetector } from '../core/ModeDetector';
import { Sampler } from '../core/Sampler';
import { Evaluator } from '../core/Evaluator';
import type { RenderConfig, SampleResult, DefinitionsMap } from '../core/types';
import { latexToExpr } from '../utils/latexToExpr';

const INITIAL_CODE = `# Lissajous / Complex Demo
f(t) = exp(-0.1*t) * (cos(5*t) + i*sin(5*t))
tmin = 0
tmax = 10
`;

export function useHelixState() {
    const [input, setInput] = useState(INITIAL_CODE);
    const [latexInput, setLatexInput] = useState("");
    const [lastGoodExpr, setLastGoodExpr] = useState("");
    const [exprError, setExprError] = useState<string | null>(null);

    const [parsed, setParsed] = useState<{ defs: DefinitionsMap, errors: string[] }>({ defs: {}, errors: [] });
    const [data, setData] = useState<SampleResult>({ points: [], validity: [] });
    const [config, setConfig] = useState<RenderConfig>({ mode: 'auto', tRange: [0, 10], tSamples: 800 });
    const [, setRevision] = useState(0);

    // Playback State (Removed - moved to usePlaybackRuntime)
    const [userPeriodT, setUserPeriodT] = useState<string>("");

    // Helper: Update Code from LaTeX (One-way sync for now)
    const updateFromLatex = (latex: string) => {
        setLatexInput(latex);
        const { expr, error } = latexToExpr(latex);

        if (error) {
            setExprError(error);
            // Don't update input code if error?
            return;
        }

        // Try to inject expr into f(t) = ...
        // We need to parse current input to find f(t) line
        const lines = input.split('\n');
        const fIdx = lines.findIndex(l => l.trim().startsWith('f(t) =') || l.trim().startsWith('f(t)='));

        if (fIdx !== -1) {
            // Check if expr is valid syntax? 
            // We rely on ExpressionParser downstream, but for "LastGood", we assume converter success = candidate.

            // Update DSL Code
            const newLines = [...lines];
            newLines[fIdx] = `f(t) = ${expr}`;
            const newInput = newLines.join('\n');

            setInput(newInput);
            setLastGoodExpr(expr);
            setExprError(null);
        } else {
            // No f(t) found? Maybe append or ignore for MVP
            // If user is in scratchpad mode, latex might not map well.
        }
    };

    // 1. Parse Input Effect
    useEffect(() => {
        const { definitions, errors } = ExpressionParser.parse(input);
        const detMode = ModeDetector.detect(definitions);

        const ev = new Evaluator({});
        const constants: any = {};
        Object.values(definitions).forEach(d => {
            if (d.params.length === 0) {
                try { constants[d.target] = ev.evaluate(d.expr); } catch { }
            }
        });

        // Detect embedded period
        if (typeof constants['period'] === 'number') setUserPeriodT(String(constants['period']));
        else if (typeof constants['T'] === 'number') setUserPeriodT(String(constants['T']));
        else if (typeof constants['Period'] === 'number') setUserPeriodT(String(constants['Period']));
        else setUserPeriodT(""); // key: reset if not found

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

        setParsed({ defs: definitions, errors });
        setConfig(newConfig);
    }, [input]);

    // 2. Sample Data Effect
    useEffect(() => {
        if (Object.keys(parsed.defs).length === 0) return;
        const result = Sampler.sample(parsed.defs, config);

        // Update revision and data atomically-ish
        setRevision(prev => {
            const next = prev + 1;
            setData({ ...result, revision: next });
            return next;
        });
    }, [parsed.defs, config]);

    return {
        input, setInput,
        latexInput, updateFromLatex, setLatexInputRaw: setLatexInput,
        lastGoodExpr,
        exprError,
        errors: parsed.errors,
        data,
        config,
        userPeriodT,
    };
}
