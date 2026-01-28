import { describe, it, expect } from 'vitest';
import { ExpressionParser } from '../../src/core/ExpressionParser';

describe('ExpressionParser', () => {
    describe('parse', () => {
        it('parses simple constant assignment', () => {
            const result = ExpressionParser.parse('a = 5');
            expect(result.errors).toHaveLength(0);
            expect(result.definitions['a']).toBeDefined();
            expect(result.definitions['a'].target).toBe('a');
            expect(result.definitions['a'].params).toHaveLength(0);
            expect(result.definitions['a'].expr).toBe('5');
        });

        it('parses function definition with single parameter', () => {
            const result = ExpressionParser.parse('f(t) = sin(t)');
            expect(result.errors).toHaveLength(0);
            expect(result.definitions['f']).toBeDefined();
            expect(result.definitions['f'].target).toBe('f');
            expect(result.definitions['f'].params).toEqual(['t']);
            expect(result.definitions['f'].expr).toBe('sin(t)');
        });

        it('parses function definition with multiple parameters', () => {
            const result = ExpressionParser.parse('z(x, y) = x^2 + y^2');
            expect(result.errors).toHaveLength(0);
            expect(result.definitions['z']).toBeDefined();
            expect(result.definitions['z'].params).toEqual(['x', 'y']);
        });

        it('detects vector expressions', () => {
            const result = ExpressionParser.parse('f(t) = (cos(t), sin(t), t)');
            expect(result.errors).toHaveLength(0);
            expect(result.definitions['f'].isVector).toBe(true);
        });

        it('parses multiple lines', () => {
            const code = `tmin = 0
tmax = 10
f(t) = sin(t)`;
            const result = ExpressionParser.parse(code);
            expect(result.errors).toHaveLength(0);
            expect(Object.keys(result.definitions)).toHaveLength(3);
        });

        it('ignores comment lines', () => {
            const code = `# This is a comment
// Another comment
f(t) = cos(t)`;
            const result = ExpressionParser.parse(code);
            expect(result.errors).toHaveLength(0);
            expect(Object.keys(result.definitions)).toHaveLength(1);
        });

        it('ignores empty lines', () => {
            const code = `

f(t) = cos(t)

`;
            const result = ExpressionParser.parse(code);
            expect(result.errors).toHaveLength(0);
            expect(Object.keys(result.definitions)).toHaveLength(1);
        });

        it('reports error for missing = sign', () => {
            const result = ExpressionParser.parse('f(t) sin(t)');
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors[0]).toContain("Missing '='");
        });

        it('reports error for invalid LHS', () => {
            const result = ExpressionParser.parse('123 = sin(t)');
            expect(result.errors.length).toBeGreaterThan(0);
        });

        it('handles complex preset (Lissajous)', () => {
            const code = `# Lissajous / Complex Demo
f(t) = exp(-0.1*t) * (cos(5*t) + i*sin(5*t))
tmin = 0
tmax = 10`;
            const result = ExpressionParser.parse(code);
            expect(result.errors).toHaveLength(0);
            expect(result.definitions['f']).toBeDefined();
            expect(result.definitions['tmin'].expr).toBe('0');
            expect(result.definitions['tmax'].expr).toBe('10');
        });

        it('overwrites duplicate definitions', () => {
            const code = `a = 5
a = 10`;
            const result = ExpressionParser.parse(code);
            expect(result.definitions['a'].expr).toBe('10');
        });

        it('parses variable names with underscores', () => {
            const result = ExpressionParser.parse('my_var = 42');
            expect(result.definitions['my_var']).toBeDefined();
        });
    });
});
