import * as math from 'mathjs';

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
    private scope: any = {};

    constructor(initialScope: any = {}) {
        this.scope = {
            ...initialScope,
            // Add standard constants that mathjs might not have or overrides
            pi: Math.PI,
            e: Math.E,
            i: m.complex(0, 1),
            j: m.complex(0, 1),
            tau: 2 * Math.PI,

            // Complex helper functions
            re: (z: any) => m.re(z),
            im: (z: any) => m.im(z),
            conj: (z: any) => m.conj(z),
            arg: (z: any) => m.arg(z),
            polar: (r: number, theta: number) => m.complex({ r, phi: theta }),

            // Strict Domain Checks for Integer functions
            floor: (x: any) => {
                if (m.typeOf(x) === 'Complex') throw new Error("floor is not defined for Complex numbers");
                return m.floor(x);
            },
            ceil: (x: any) => {
                if (m.typeOf(x) === 'Complex') throw new Error("ceil is not defined for Complex numbers");
                return m.ceil(x);
            },
            round: (x: any) => {
                if (m.typeOf(x) === 'Complex') throw new Error("round is not defined for Complex numbers");
                return m.round(x);
            },
            mod: (a: any, b: any) => {
                if (m.typeOf(a) === 'Complex' || m.typeOf(b) === 'Complex') throw new Error("mod is not defined for Complex numbers");
                return m.mod(a, b);
            }
        };
    }

    // Update scope with constant definitions (e.g. a = 1)
    updateScope(definitions: Record<string, any>) {
        Object.keys(definitions).forEach(key => {
            this.scope[key] = definitions[key];
        });
    }

    // Evaluate a specific expression with an optional local scope (e.g. t=...)
    evaluate(expr: string, localScope: any = {}) {
        try {
            // Merge scopes
            const combinedScope = { ...this.scope, ...localScope };
            return m.evaluate(expr, combinedScope);
        } catch (e: any) {
            // Return NaN or throw? 
            // For sampling, throwing might be better to catch issues early, 
            // or return NaN to create gaps.
            return NaN;
        }
    }

    // Compile for faster repeated evaluation
    compile(expr: string) {
        try {
            const code = m.compile(expr);
            return (localScope: any) => {
                const combinedScope = { ...this.scope, ...localScope };
                return code.evaluate(combinedScope);
            }
        } catch (error) {
            return () => NaN;
        }
    }
}

export const mathInstance = m;
