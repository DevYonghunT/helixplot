import type { DefinitionsMap, RenderConfig, SampleResult } from './types';
import { Evaluator } from './Evaluator';

export class Sampler {
    static sample(defs: DefinitionsMap, config: RenderConfig): SampleResult {
        const evaluator = new Evaluator({});
        // Pre-populate scope with fixed values (constants)
        // For now we just compile generic expressions? 
        // Actually we need to handle specific function definitions.

        // 1. Setup Scope with independent variables (a=1 etc)
        const constantScope: Record<string, any> = {};
        Object.values(defs).forEach(def => {
            if (def.params.length === 0 && !def.target.includes('(')) {
                // Constant assignment like a=1
                try {
                    constantScope[def.target] = evaluator.evaluate(def.expr);
                } catch {
                    // Silent: Invalid constant expressions are skipped
                    // (e.g., referencing undefined variables)
                }
            }
        });
        evaluator.updateScope(constantScope);

        if (config.mode === 'curve' || config.mode === 'complex') {
            return this.sampleCurve(defs, config, evaluator);
        }
        else if (config.mode === 'surface') {
            return this.sampleSurface(defs, config, evaluator);
        }

        return { points: [], validity: [] };
    }

    private static sampleCurve(defs: DefinitionsMap, config: RenderConfig, evaluator: Evaluator): SampleResult {
        const { tRange, tSamples } = config;
        const [tmin, tmax] = tRange;
        const points: { x: number, y: number, z: number }[] = [];
        const validity: boolean[] = [];

        // Compile functions for speed
        let getPoint: (t: number) => { x: number, y: number, z: number } | null = () => null;

        if (defs['r'] && defs['r'].isVector) {
            // r(t) = (x, y, z)
            // We need to parse the tuple inside the evaluator or split it up.
            // Mathjs supports matrices/arrays: [x, y, z]
            // But our parser identified it as vector.
            // Let's assume expr is "(...)" and mathjs can evaluate it as Matrix or Array
            // We replace ( ) with [ ] for mathjs if needed, or rely on mathjs tuple support?
            // Mathjs uses [] for vectors usually.
            let expr = defs['r'].expr;
            if (expr.startsWith('(') && expr.endsWith(')')) {
                expr = '[' + expr.substring(1, expr.length - 1) + ']';
            }
            const compiled = evaluator.compile(expr);
            getPoint = (t: number) => {
                const res = compiled({ t });
                // res should be Array or Matrix
                const arr = res.valueOf() as number[]; // or Complex[]
                // We assume real output for now for 3D View
                // If complex, take real part? Or abs?
                // MVP: Expect reals.
                return { x: Number(arr[0]), y: Number(arr[1]), z: Number(arr[2]) };
            };
        } else if (defs['x'] && defs['y']) {
            // Parametric x(t), y(t), z(t) defaults to 0
            const xFn = evaluator.compile(defs['x'] ? defs['x'].expr : '0');
            const yFn = evaluator.compile(defs['y'] ? defs['y'].expr : '0');
            const zFn = evaluator.compile(defs['z'] ? defs['z'].expr : '0');

            getPoint = (t: number) => ({
                x: Number(xFn({ t })),
                y: Number(yFn({ t })),
                z: Number(zFn({ t }))
            });
        } else if (defs['f']) {
            // Complex Mode
            // Default Mapping: t, Re, Im
            const fFn = evaluator.compile(defs['f'].expr);
            getPoint = (t: number) => {
                const val = fFn({ t }); // Complex or number
                // mathjs complex object has re, im properties
                // Cast to access these properties safely
                const complexVal = val as { re?: number; im?: number };
                const re = complexVal.re !== undefined ? complexVal.re : Number(val);
                const im = complexVal.im !== undefined ? complexVal.im : 0;

                // Mapping A: t, re, im
                return { x: t, y: re, z: im };
            };
        }

        let lastValid: { x: number, y: number, z: number } | null = null;

        for (let i = 0; i < tSamples; i++) {
            const t = tmin + (tmax - tmin) * (i / (tSamples - 1));
            try {
                const p = getPoint(t);
                if (p && isFinite(p.x) && isFinite(p.y) && isFinite(p.z)) {
                    points.push(p);
                    validity.push(true);
                    lastValid = p;
                } else {
                    // Use last valid point or NaN marker to avoid origin spikes
                    points.push(lastValid ? { ...lastValid } : { x: NaN, y: NaN, z: NaN });
                    validity.push(false);
                }
            } catch {
                // Math error at this t value - use fallback to avoid gaps
                points.push(lastValid ? { ...lastValid } : { x: NaN, y: NaN, z: NaN });
                validity.push(false);
            }
        }

        return { points, validity };
    }

    private static sampleSurface(defs: DefinitionsMap, config: RenderConfig, evaluator: Evaluator): SampleResult {
        // MVP Surface: z = f(x,y)
        // We assume 2D x,y loop
        // BUT our 'SampleResult' structure with 'points' list is for lines.
        // For surface we need a grid.
        // Let's implement basic grid sampling.

        // Check config ranges
        const xRange = config.xRange || [-5, 5];
        const yRange = config.yRange || [-5, 5];
        const gridSize = config.gridSize || [50, 50];

        const [xmin, xmax] = xRange;
        const [ymin, ymax] = yRange;
        const [Nx, Ny] = gridSize;

        const grid: { x: number, y: number, z: number }[][] = [];
        const points: { x: number, y: number, z: number }[] = []; // Also populate flat points for debugging/dots

        let zFn: (scope: any) => any = () => 0;
        if (defs['z']) zFn = evaluator.compile(defs['z'].expr);
        // Support z(x,y)? 

        for (let i = 0; i < Nx; i++) {
            const row: { x: number, y: number, z: number }[] = [];
            const x = xmin + (xmax - xmin) * (i / (Nx - 1));

            for (let j = 0; j < Ny; j++) {
                const y = ymin + (ymax - ymin) * (j / (Ny - 1));

                try {
                    const z = Number(zFn({ x, y }));
                    const p = { x, y, z };
                    row.push(p);
                    points.push(p); // Flattened
                } catch {
                    // Math error at this (x,y) - use NaN to indicate invalid point
                    row.push({ x, y, z: NaN });
                    points.push({ x, y, z: NaN });
                }
            }
            grid.push(row);
        }

        const validity = points.map(p => isFinite(p.z));
        return { points, grid, validity };
    }
}
