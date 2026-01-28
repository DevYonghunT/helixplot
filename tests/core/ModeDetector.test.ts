import { describe, it, expect } from 'vitest';
import { ModeDetector } from '../../src/core/ModeDetector';
import type { DefinitionsMap } from '../../src/core/types';

function makeDef(target: string, params: string[], expr: string, isVector = false) {
    return { raw: `${target} = ${expr}`, target, params, expr, isVector };
}

describe('ModeDetector', () => {
    it('detects vector curve mode from r(t) vector', () => {
        const defs: DefinitionsMap = {
            r: makeDef('r', ['t'], '(cos(t), sin(t), t)', true),
        };
        expect(ModeDetector.detect(defs)).toBe('curve');
    });

    it('detects curve mode from x(t), y(t), z(t)', () => {
        const defs: DefinitionsMap = {
            x: makeDef('x', ['t'], 'cos(t)'),
            y: makeDef('y', ['t'], 'sin(t)'),
            z: makeDef('z', ['t'], 't'),
        };
        expect(ModeDetector.detect(defs)).toBe('curve');
    });

    it('detects complex mode from f(t)', () => {
        const defs: DefinitionsMap = {
            f: makeDef('f', ['t'], 'cos(t) + i*sin(t)'),
        };
        expect(ModeDetector.detect(defs)).toBe('complex');
    });

    it('detects surface mode from z without x,y', () => {
        const defs: DefinitionsMap = {
            z: makeDef('z', ['x', 'y'], 'x^2 + y^2'),
        };
        expect(ModeDetector.detect(defs)).toBe('surface');
    });

    it('returns auto for empty definitions', () => {
        expect(ModeDetector.detect({})).toBe('auto');
    });

    it('returns auto for unrelated definitions', () => {
        const defs: DefinitionsMap = {
            tmin: makeDef('tmin', [], '0'),
            tmax: makeDef('tmax', [], '10'),
        };
        expect(ModeDetector.detect(defs)).toBe('auto');
    });

    it('complex mode with constant definitions alongside f(t)', () => {
        const defs: DefinitionsMap = {
            f: makeDef('f', ['t'], 'exp(-0.1*t) * (cos(5*t) + i*sin(5*t))'),
            tmin: makeDef('tmin', [], '0'),
            tmax: makeDef('tmax', [], '10'),
        };
        expect(ModeDetector.detect(defs)).toBe('complex');
    });
});
