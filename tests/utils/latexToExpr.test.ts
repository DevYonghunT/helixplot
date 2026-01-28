import { describe, it, expect } from 'vitest';
import { latexToExpr, exprToLatex } from '../../src/utils/latexToExpr';

describe('latexToExpr', () => {
    // ─── Basic Tests ─────────────────────────────────────────

    it('returns empty for empty input', () => {
        expect(latexToExpr('')).toEqual({ expr: '', error: null });
        expect(latexToExpr('  ')).toEqual({ expr: '', error: null });
    });

    it('passes through simple variables', () => {
        const r = latexToExpr('t');
        expect(r.error).toBeNull();
        expect(r.expr).toBe('t');
    });

    it('passes through numbers', () => {
        const r = latexToExpr('42');
        expect(r.error).toBeNull();
        expect(r.expr).toBe('42');
    });

    // ─── Constants ───────────────────────────────────────────

    it('converts \\pi to pi', () => {
        const r = latexToExpr('\\pi');
        expect(r.expr).toBe('pi');
    });

    it('converts \\theta to t', () => {
        const r = latexToExpr('\\theta');
        expect(r.expr).toBe('t');
    });

    it('converts \\infty to Infinity', () => {
        const r = latexToExpr('\\infty');
        expect(r.expr).toBe('Infinity');
    });

    // ─── Functions ───────────────────────────────────────────

    it('converts \\sin{x} to sin(x)', () => {
        const r = latexToExpr('\\sin{x}');
        expect(r.error).toBeNull();
        expect(r.expr).toBe('sin(x)');
    });

    it('converts \\cos(t) to cos(t)', () => {
        const r = latexToExpr('\\cos(t)');
        expect(r.error).toBeNull();
        expect(r.expr).toBe('cos(t)');
    });

    it('converts \\tan{x} to tan(x)', () => {
        const r = latexToExpr('\\tan{x}');
        expect(r.expr).toBe('tan(x)');
    });

    it('converts \\ln{x} to log(x)', () => {
        const r = latexToExpr('\\ln{x}');
        expect(r.expr).toBe('log(x)');
    });

    it('converts \\log{x} to log10(x)', () => {
        const r = latexToExpr('\\log{x}');
        expect(r.expr).toBe('log10(x)');
    });

    it('converts \\exp{x} to exp(x)', () => {
        const r = latexToExpr('\\exp{x}');
        expect(r.expr).toBe('exp(x)');
    });

    it('converts inverse trig functions', () => {
        expect(latexToExpr('\\arcsin{x}').expr).toBe('asin(x)');
        expect(latexToExpr('\\arccos{x}').expr).toBe('acos(x)');
        expect(latexToExpr('\\arctan{x}').expr).toBe('atan(x)');
    });

    it('converts hyperbolic functions', () => {
        expect(latexToExpr('\\sinh{x}').expr).toBe('sinh(x)');
        expect(latexToExpr('\\cosh{x}').expr).toBe('cosh(x)');
        expect(latexToExpr('\\tanh{x}').expr).toBe('tanh(x)');
    });

    // ─── sin^2(x) pattern ────────────────────────────────────

    it('converts \\sin^{2}(x) to sin(x)^(2)', () => {
        const r = latexToExpr('\\sin^{2}(x)');
        expect(r.error).toBeNull();
        expect(r.expr).toBe('sin(x)^(2)');
    });

    it('converts \\cos^{2}{t} to cos(t)^(2)', () => {
        const r = latexToExpr('\\cos^{2}{t}');
        expect(r.expr).toBe('cos(t)^(2)');
    });

    // ─── Fractions ───────────────────────────────────────────

    it('converts \\frac{a}{b} to (a)/(b)', () => {
        const r = latexToExpr('\\frac{a}{b}');
        expect(r.error).toBeNull();
        expect(r.expr).toContain('(a)/(b)');
    });

    it('converts nested fractions', () => {
        const r = latexToExpr('\\frac{1}{\\frac{a}{b}}');
        expect(r.error).toBeNull();
        expect(r.expr).toContain('(1)/((a)/(b))');
    });

    it('converts fraction with expressions', () => {
        const r = latexToExpr('\\frac{x+1}{x-1}');
        expect(r.error).toBeNull();
        expect(r.expr).toContain('/(');
    });

    // ─── Square Root ─────────────────────────────────────────

    it('converts \\sqrt{x} to sqrt(x)', () => {
        const r = latexToExpr('\\sqrt{x}');
        expect(r.error).toBeNull();
        expect(r.expr).toBe('sqrt(x)');
    });

    it('converts \\sqrt[3]{x} to nth root', () => {
        const r = latexToExpr('\\sqrt[3]{x}');
        expect(r.error).toBeNull();
        expect(r.expr).toContain('(x)^(1/(3))');
    });

    // ─── Powers ──────────────────────────────────────────────

    it('converts x^{2} to x^(2)', () => {
        const r = latexToExpr('x^{2}');
        expect(r.error).toBeNull();
        expect(r.expr).toContain('^(2)');
    });

    it('converts t^{n+1} to t^(n+1)', () => {
        const r = latexToExpr('t^{n+1}');
        expect(r.error).toBeNull();
        expect(r.expr).toContain('^(n+1)');
    });

    // ─── Operators ───────────────────────────────────────────

    it('converts \\cdot to *', () => {
        const r = latexToExpr('a \\cdot b');
        expect(r.expr).toContain('*');
    });

    it('converts \\times to *', () => {
        const r = latexToExpr('a \\times b');
        expect(r.expr).toContain('*');
    });

    // ─── Implicit Multiplication ─────────────────────────────

    it('adds implicit multiplication: 2t → 2*t', () => {
        const r = latexToExpr('2t');
        expect(r.expr).toBe('2*t');
    });

    it('adds implicit multiplication: 2(x) → 2*(x)', () => {
        const r = latexToExpr('2(x)');
        expect(r.expr).toContain('2*(');
    });

    it('does NOT add * inside function names', () => {
        const r = latexToExpr('\\sin(t)');
        expect(r.expr).toBe('sin(t)');
        expect(r.expr).not.toContain('s*');
    });

    // ─── Subscripts ──────────────────────────────────────────

    it('handles subscripts: x_{1} → x1', () => {
        const r = latexToExpr('x_{1}');
        expect(r.error).toBeNull();
        expect(r.expr).toContain('x');
        expect(r.expr).toContain('1');
    });

    // ─── e^ → exp() ─────────────────────────────────────────

    it('converts standalone e^ to exp()', () => {
        const r = latexToExpr('e^{x}');
        expect(r.error).toBeNull();
        expect(r.expr).toContain('exp');
    });

    it('does NOT convert epsilon to exp + silon', () => {
        const r = latexToExpr('\\epsilon');
        expect(r.expr).toBe('epsilon');
        expect(r.expr).not.toContain('exp');
    });

    // ─── LaTeX cleanup ───────────────────────────────────────

    it('strips \\left and \\right', () => {
        const r = latexToExpr('\\left(x+1\\right)');
        expect(r.error).toBeNull();
        expect(r.expr).toContain('(x+1)');
    });

    it('strips \\displaystyle', () => {
        const r = latexToExpr('\\displaystyle x');
        expect(r.error).toBeNull();
        expect(r.expr).toBe('x');
    });

    // ─── Real-world expressions ──────────────────────────────

    it('converts Lissajous: e^{-0.1t}(\\cos(5t) + i\\sin(5t))', () => {
        const r = latexToExpr('e^{-0.1t}( \\cos(5t) + i\\sin(5t) )');
        expect(r.error).toBeNull();
        expect(r.expr).toContain('exp');
        expect(r.expr).toContain('cos');
        expect(r.expr).toContain('sin');
    });

    it('converts simple fraction: \\frac{1}{1+t}', () => {
        const r = latexToExpr('\\frac{1}{1+t}');
        expect(r.error).toBeNull();
        expect(r.expr).toContain('(1)/(1+t)');
    });
});

describe('exprToLatex', () => {
    it('converts sin to \\sin', () => {
        expect(exprToLatex('sin(t)')).toContain('\\sin');
    });

    it('converts pi to \\pi', () => {
        expect(exprToLatex('pi')).toContain('\\pi');
    });

    it('converts * to \\cdot', () => {
        expect(exprToLatex('a*b')).toContain('\\cdot');
    });

    it('returns empty for empty input', () => {
        expect(exprToLatex('')).toBe('');
    });
});
