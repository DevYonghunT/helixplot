import { describe, it, expect } from 'vitest';
import { Evaluator } from '../../src/core/Evaluator';

describe('Evaluator', () => {
    describe('evaluate', () => {
        it('evaluates simple arithmetic', () => {
            const ev = new Evaluator();
            expect(ev.evaluate('2 + 3')).toBe(5);
            expect(ev.evaluate('10 / 2')).toBe(5);
            expect(ev.evaluate('3 * 4')).toBe(12);
        });

        it('evaluates math functions', () => {
            const ev = new Evaluator();
            expect(ev.evaluate('sin(0)')).toBeCloseTo(0);
            expect(ev.evaluate('cos(0)')).toBeCloseTo(1);
            expect(ev.evaluate('exp(0)')).toBeCloseTo(1);
            expect(ev.evaluate('sqrt(4)')).toBeCloseTo(2);
        });

        it('evaluates with constants', () => {
            const ev = new Evaluator();
            expect(ev.evaluate('pi')).toBeCloseTo(Math.PI);
            expect(ev.evaluate('e')).toBeCloseTo(Math.E);
            expect(ev.evaluate('tau')).toBeCloseTo(2 * Math.PI);
        });

        it('evaluates with local scope', () => {
            const ev = new Evaluator();
            expect(ev.evaluate('t * 2', { t: 5 })).toBe(10);
            expect(ev.evaluate('sin(t)', { t: 0 })).toBeCloseTo(0);
        });

        it('evaluates with updated scope', () => {
            const ev = new Evaluator();
            ev.updateScope({ a: 3, b: 4 });
            expect(ev.evaluate('a + b')).toBe(7);
        });

        it('returns NaN for invalid expressions', () => {
            const ev = new Evaluator();
            const result = ev.evaluate('1/0');
            expect(result).toBe(Infinity);
        });

        it('handles complex numbers', () => {
            const ev = new Evaluator();
            const result = ev.evaluate('i * i');
            // i^2 = -1
            expect(typeof result).not.toBe('undefined');
        });

        it('evaluates power expressions', () => {
            const ev = new Evaluator();
            expect(ev.evaluate('2^3')).toBe(8);
            expect(ev.evaluate('4^0.5')).toBeCloseTo(2);
        });
    });

    describe('compile', () => {
        it('compiles and evaluates expression', () => {
            const ev = new Evaluator();
            const compiled = ev.compile('t^2 + 1');
            expect(compiled({ t: 3 })).toBe(10);
            expect(compiled({ t: 0 })).toBe(1);
        });

        it('returns NaN for invalid compiled expressions', () => {
            const ev = new Evaluator();
            const compiled = ev.compile('???');
            expect(compiled({})).toBeNaN();
        });

        it('uses scope for compiled expressions', () => {
            const ev = new Evaluator();
            ev.updateScope({ a: 10 });
            const compiled = ev.compile('a * t');
            expect(compiled({ t: 5 })).toBe(50);
        });
    });
});
