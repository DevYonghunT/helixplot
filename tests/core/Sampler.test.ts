import { describe, it, expect } from 'vitest';
import { Sampler } from '../../src/core/Sampler';
import { ExpressionParser } from '../../src/core/ExpressionParser';
import { ModeDetector } from '../../src/core/ModeDetector';
import type { RenderConfig } from '../../src/core/types';

function sampleFromCode(code: string, overrides?: Partial<RenderConfig>) {
    const { definitions } = ExpressionParser.parse(code);
    const mode = ModeDetector.detect(definitions);
    const config: RenderConfig = {
        mode,
        tRange: [0, 10],
        tSamples: 100,
        ...overrides,
    };
    return Sampler.sample(definitions, config);
}

describe('Sampler', () => {
    describe('curve sampling', () => {
        it('samples a complex curve f(t)', () => {
            const result = sampleFromCode('f(t) = cos(t) + i*sin(t)');
            expect(result.points.length).toBe(100);
            expect(result.validity.length).toBe(100);
            // First point at t=0: cos(0)=1, sin(0)=0
            expect(result.points[0].y).toBeCloseTo(1, 1);
            expect(result.points[0].z).toBeCloseTo(0, 1);
        });

        it('samples parametric x(t), y(t), z(t) curve', () => {
            const code = `x(t) = cos(t)
y(t) = sin(t)
z(t) = t`;
            const result = sampleFromCode(code);
            expect(result.points.length).toBe(100);
            // At t=0: cos(0)=1, sin(0)=0, z=0
            expect(result.points[0].x).toBeCloseTo(1, 1);
            expect(result.points[0].y).toBeCloseTo(0, 1);
            expect(result.points[0].z).toBeCloseTo(0, 1);
        });

        it('respects tRange', () => {
            const result = sampleFromCode('f(t) = t + 0*i', { tRange: [5, 15], tSamples: 50 });
            expect(result.points.length).toBe(50);
            // First point x should be t=5
            expect(result.points[0].x).toBeCloseTo(5, 1);
        });

        it('handles constants in expression', () => {
            const code = `a = 2
f(t) = a*cos(t) + i*a*sin(t)`;
            const result = sampleFromCode(code);
            expect(result.points.length).toBe(100);
            // At t=0: 2*cos(0)=2, 2*sin(0)=0
            expect(result.points[0].y).toBeCloseTo(2, 1);
        });
    });

    describe('invalid points', () => {
        it('marks invalid points with validity=false', () => {
            // 1/t has a singularity at t=0
            const result = sampleFromCode('f(t) = (1/t) + 0*i', { tRange: [-1, 1], tSamples: 21 });
            // Middle point at t=0 should be invalid
            const midIdx = 10;
            // Point at t=0 => 1/0 = Infinity => invalid
            expect(result.validity[midIdx]).toBe(false);
        });

        it('produces all valid points for well-behaved function', () => {
            const result = sampleFromCode('f(t) = cos(t) + 0*i', { tRange: [0, 6.28], tSamples: 50 });
            const allValid = result.validity.every(v => v);
            expect(allValid).toBe(true);
        });
    });

    describe('surface sampling', () => {
        it('samples surface z(x,y)', () => {
            const code = `z(x, y) = x + y`;
            const result = sampleFromCode(code, {
                mode: 'surface',
                xRange: [-1, 1],
                yRange: [-1, 1],
                gridSize: [10, 10],
            });
            expect(result.grid).toBeDefined();
            expect(result.grid!.length).toBe(10);
            expect(result.grid![0].length).toBe(10);
        });
    });

    describe('integration: parse → detect → sample', () => {
        it('handles full Lissajous preset', () => {
            const code = `# Lissajous / Complex Demo
f(t) = exp(-0.1*t) * (cos(5*t) + i*sin(5*t))
tmin = 0
tmax = 10`;
            const { definitions, errors } = ExpressionParser.parse(code);
            expect(errors).toHaveLength(0);

            const mode = ModeDetector.detect(definitions);
            expect(mode).toBe('complex');

            const config: RenderConfig = { mode, tRange: [0, 10], tSamples: 200 };
            const result = Sampler.sample(definitions, config);
            expect(result.points.length).toBe(200);

            // Should be mostly valid
            const validCount = result.validity.filter(v => v).length;
            expect(validCount).toBeGreaterThan(190);
        });

        it('handles Rose k=5 preset', () => {
            const code = `f(t) = cos(5*t)*cos(t) + i*(cos(5*t)*sin(t))
tmin = 0
tmax = 6.283185307179586`;
            const { definitions } = ExpressionParser.parse(code);
            const mode = ModeDetector.detect(definitions);
            const result = Sampler.sample(definitions, { mode, tRange: [0, 6.28], tSamples: 200 });
            expect(result.points.length).toBe(200);
            const allValid = result.validity.every(v => v);
            expect(allValid).toBe(true);
        });
    });
});
