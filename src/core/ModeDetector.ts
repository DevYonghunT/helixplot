import type { DefinitionsMap, Mode } from './types';

export class ModeDetector {
    static detect(defs: DefinitionsMap): Mode {
        // 1. Parametric Curve 3D
        // r(t) vector
        if (defs['r'] && defs['r'].isVector) return 'curve';

        // x(t), y(t), z(t) combination
        if (defs['x'] && defs['y'] && defs['z']) {
            // Technically should check if they depend on 't', but for Auto mode heuristic this is fine
            return 'curve';
        }

        // 2. Complex Curve
        // f(t) -> mapping
        if (defs['f']) {
            return 'complex';
        }

        // 3. Surface
        // z(x,y) or f(x,y)
        // Check if free variables 'x' and 'y' are used? 
        // Or if definition has params ['x', 'y']
        // For MVP, if we see z = ... (and it's not part of x,y,z curve set)
        // Actually if we have z but not x,y definitions, it's likely surface z=f(x,y)
        // But simplistic check:
        if (defs['z'] && (!defs['x'] || !defs['y'])) return 'surface';

        return 'auto'; // Default or Indeterminate
    }
}
