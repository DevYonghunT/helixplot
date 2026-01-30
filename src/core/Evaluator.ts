import * as math from 'mathjs';
import type { Complex, EvalFunction } from 'mathjs';

/**
 * Scope for mathjs evaluation - maps variable names to values.
 * Values can be numbers, Complex, Matrix, BigNumber, arrays, or functions.
 *
 * Note: We use `unknown` instead of `any` for values to encourage explicit
 * type handling in consumers while allowing mathjs's flexible type system.
 */
export type EvaluatorScope = Record<string, unknown>;

/**
 * Result of mathjs evaluation.
 * Can be a number, Complex (with .re/.im), Matrix (with .valueOf()), etc.
 *
 * When the result is a Complex number:
 * - Access real part via `result.re`
 * - Access imaginary part via `result.im`
 *
 * When the result is a Matrix/Array:
 * - Use `result.valueOf()` to get the underlying array
 */
export type EvaluatorResult = number | Complex | math.Matrix | math.BigNumber | number[];

// Configure mathjs
const config: math.ConfigOptions = {
    epsilon: 1e-12,
    matrix: 'Matrix',
    number: 'number',
    precision: 64,
    predictable: false,
    randomSeed: null
};

const m = math.create(math.all, config);

// Add custom functions or constants if needed
// m.import({})

export class Evaluator {
    private scope: EvaluatorScope = {};

    constructor(initialScope: EvaluatorScope = {}) {
        this.scope = {
            ...initialScope,
            // Add standard constants that mathjs might not have or overrides
            pi: Math.PI,
            e: Math.E,
            i: m.complex(0, 1),
            j: m.complex(0, 1),
            tau: 2 * Math.PI,

            // Complex helper functions
            // Note: mathjs types are overly restrictive for re/im/conj/arg
            // They work correctly at runtime with number | Complex
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            re: (z: number | Complex) => (m.re as any)(z),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            im: (z: number | Complex) => (m.im as any)(z),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            conj: (z: number | Complex) => (m.conj as any)(z),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            arg: (z: number | Complex) => (m.arg as any)(z),
            polar: (r: number, theta: number) => m.complex({ r, phi: theta }),

            // Strict Domain Checks for Integer functions
            floor: (x: number | Complex) => {
                if (m.typeOf(x) === 'Complex') throw new Error("floor is not defined for Complex numbers");
                return m.floor(x as number);
            },
            ceil: (x: number | Complex) => {
                if (m.typeOf(x) === 'Complex') throw new Error("ceil is not defined for Complex numbers");
                return m.ceil(x as number);
            },
            round: (x: number | Complex) => {
                if (m.typeOf(x) === 'Complex') throw new Error("round is not defined for Complex numbers");
                return m.round(x as number);
            },
            mod: (a: number | Complex, b: number | Complex) => {
                if (m.typeOf(a) === 'Complex' || m.typeOf(b) === 'Complex') throw new Error("mod is not defined for Complex numbers");
                return m.mod(a as number, b as number);
            }
        };
    }

    /**
     * Update scope with constant definitions (e.g. a = 1)
     * @param definitions - Record of variable names to values
     */
    updateScope(definitions: EvaluatorScope): void {
        Object.keys(definitions).forEach(key => {
            this.scope[key] = definitions[key];
        });
    }

    /**
     * Evaluate a mathematical expression with an optional local scope.
     * @param expr - The mathematical expression string (e.g., "sin(t) * 2")
     * @param localScope - Optional local variables (e.g., { t: 0.5 })
     * @returns The evaluation result, or NaN if evaluation fails
     */
    evaluate(expr: string, localScope: EvaluatorScope = {}): EvaluatorResult {
        try {
            // Merge scopes
            const combinedScope = { ...this.scope, ...localScope };
            return m.evaluate(expr, combinedScope) as EvaluatorResult;
        } catch {
            // Return NaN for invalid expressions to create gaps in visualization
            // This is intentional - errors at specific parameter values are expected
            // (e.g., division by zero at certain t values)
            return NaN;
        }
    }

    /**
     * Compile an expression for faster repeated evaluation.
     * @param expr - The mathematical expression string
     * @returns A function that evaluates the expression with a given local scope
     */
    compile(expr: string): (localScope: EvaluatorScope) => EvaluatorResult {
        try {
            const code: EvalFunction = m.compile(expr);
            return (localScope: EvaluatorScope): EvaluatorResult => {
                const combinedScope = { ...this.scope, ...localScope };
                return code.evaluate(combinedScope) as EvaluatorResult;
            };
        } catch {
            // Return a function that always returns NaN for invalid expressions
            return (): number => NaN;
        }
    }
}

export const mathInstance = m;
