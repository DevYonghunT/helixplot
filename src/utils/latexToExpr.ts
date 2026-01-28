/**
 * LaTeX ↔ DSL bidirectional converter
 * Token-based approach for robust conversion
 */

// Known math functions in our DSL (mathjs compatible)
const KNOWN_FUNCTIONS = new Set([
    'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'atan2',
    'sinh', 'cosh', 'tanh', 'asinh', 'acosh', 'atanh',
    'sqrt', 'cbrt', 'abs', 'sign', 'floor', 'ceil', 'round',
    'exp', 'log', 'log2', 'log10',
    'min', 'max', 'mod', 'gcd',
    're', 'im', 'conj', 'arg', 'polar',
]);

// LaTeX command → DSL function mapping
const LATEX_FUNC_MAP: Record<string, string> = {
    '\\sin': 'sin',
    '\\cos': 'cos',
    '\\tan': 'tan',
    '\\arcsin': 'asin',
    '\\arccos': 'acos',
    '\\arctan': 'atan',
    '\\sinh': 'sinh',
    '\\cosh': 'cosh',
    '\\tanh': 'tanh',
    '\\ln': 'log',       // LaTeX \ln → mathjs log (natural log)
    '\\log': 'log10',    // LaTeX \log → mathjs log10
    '\\exp': 'exp',
    '\\sqrt': 'sqrt',
    '\\abs': 'abs',
    '\\sgn': 'sign',
    '\\min': 'min',
    '\\max': 'max',
    '\\gcd': 'gcd',
    '\\Re': 're',
    '\\Im': 'im',
};

// LaTeX constant → DSL constant mapping
const LATEX_CONST_MAP: Record<string, string> = {
    '\\pi': 'pi',
    '\\theta': 't',
    '\\phi': 'phi',
    '\\tau': 'tau',
    '\\infty': 'Infinity',
    '\\alpha': 'alpha',
    '\\beta': 'beta',
    '\\gamma': 'gamma',
    '\\omega': 'omega',
    '\\lambda': 'lambda',
    '\\mu': 'mu',
    '\\sigma': 'sigma',
    '\\epsilon': 'epsilon',
    '\\delta': 'delta',
};

const LATEX_OPERATOR_MAP: Record<string, string> = {
    '\\cdot': '*',
    '\\times': '*',
    '\\div': '/',
    '\\pm': '+',
    '\\mp': '-',
};

// ─── LaTeX → DSL ─────────────────────────────────────────────

export function latexToExpr(latex: string): { expr: string; error: string | null } {
    if (!latex || !latex.trim()) return { expr: '', error: null };

    try {
        const tokens = tokenize(latex);
        let expr = convertTokens(tokens);
        expr = addImplicitMultiplication(expr);
        expr = cleanupExpr(expr);
        return { expr, error: null };
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        return { expr: '', error: message };
    }
}

// ─── DSL → LaTeX ─────────────────────────────────────────────

const DSL_TO_LATEX_FUNC: Record<string, string> = {
    'sin': '\\sin',
    'cos': '\\cos',
    'tan': '\\tan',
    'asin': '\\arcsin',
    'acos': '\\arccos',
    'atan': '\\arctan',
    'sinh': '\\sinh',
    'cosh': '\\cosh',
    'tanh': '\\tanh',
    'log': '\\ln',
    'log10': '\\log',
    'exp': '\\exp',
    'sqrt': '\\sqrt',
    'abs': '\\abs',
};

/**
 * Convert DSL expression to LaTeX (best-effort)
 */
export function exprToLatex(expr: string): string {
    if (!expr) return '';

    let s = expr;

    // Replace known functions
    for (const [dsl, ltx] of Object.entries(DSL_TO_LATEX_FUNC)) {
        // Use word boundary to avoid partial matches
        const regex = new RegExp(`\\b${dsl}\\b`, 'g');
        s = s.replace(regex, ltx);
    }

    // Constants
    s = s.replace(/\bpi\b/g, '\\pi');
    s = s.replace(/\btau\b/g, '\\tau');

    // Power: x^(expr) → x^{expr}
    s = s.replace(/\^\(([^)]+)\)/g, '^{$1}');

    // Simple fractions: (a)/(b) → \frac{a}{b}
    s = s.replace(/\(([^()]+)\)\/\(([^()]+)\)/g, '\\frac{$1}{$2}');

    // sqrt → \sqrt{}
    s = s.replace(/\\sqrt\(([^)]+)\)/g, '\\sqrt{$1}');

    // Multiplication sign
    s = s.replace(/\*/g, ' \\cdot ');

    return s;
}

// ─── Tokenizer ───────────────────────────────────────────────

type TokenType = 'command' | 'number' | 'variable' | 'operator' | 'lbrace' | 'rbrace' | 'lparen' | 'rparen' | 'lbracket' | 'rbracket' | 'caret' | 'underscore' | 'comma';

interface Token {
    type: TokenType;
    value: string;
}

function tokenize(latex: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;

    // Strip \left and \right as they are purely display
    latex = latex.replace(/\\left/g, '').replace(/\\right/g, '');
    // Strip \displaystyle and similar
    latex = latex.replace(/\\displaystyle/g, '');
    latex = latex.replace(/\\textstyle/g, '');
    latex = latex.replace(/\\,/g, ' ');
    latex = latex.replace(/\\;/g, ' ');
    latex = latex.replace(/\\!/g, '');
    latex = latex.replace(/\\quad/g, ' ');

    while (i < latex.length) {
        const ch = latex[i];

        // Skip whitespace
        if (/\s/.test(ch)) { i++; continue; }

        // LaTeX command: \word
        if (ch === '\\') {
            let cmd = '\\';
            i++;
            while (i < latex.length && /[a-zA-Z]/.test(latex[i])) {
                cmd += latex[i];
                i++;
            }
            if (cmd.length > 1) {
                // Check if it's an operator
                if (LATEX_OPERATOR_MAP[cmd]) {
                    tokens.push({ type: 'operator', value: LATEX_OPERATOR_MAP[cmd] });
                } else {
                    tokens.push({ type: 'command', value: cmd });
                }
            }
            continue;
        }

        // Numbers (including decimals)
        if (/[0-9.]/.test(ch)) {
            let num = '';
            while (i < latex.length && /[0-9.]/.test(latex[i])) {
                num += latex[i];
                i++;
            }
            tokens.push({ type: 'number', value: num });
            continue;
        }

        // Variables (single letter identifiers)
        if (/[a-zA-Z]/.test(ch)) {
            let name = '';
            while (i < latex.length && /[a-zA-Z]/.test(latex[i])) {
                name += latex[i];
                i++;
            }
            tokens.push({ type: 'variable', value: name });
            continue;
        }

        // Operators
        if ('+-*/='.includes(ch)) {
            tokens.push({ type: 'operator', value: ch });
            i++;
            continue;
        }

        // Structural characters
        if (ch === '{') { tokens.push({ type: 'lbrace', value: '{' }); i++; continue; }
        if (ch === '}') { tokens.push({ type: 'rbrace', value: '}' }); i++; continue; }
        if (ch === '(') { tokens.push({ type: 'lparen', value: '(' }); i++; continue; }
        if (ch === ')') { tokens.push({ type: 'rparen', value: ')' }); i++; continue; }
        if (ch === '[') { tokens.push({ type: 'lbracket', value: '[' }); i++; continue; }
        if (ch === ']') { tokens.push({ type: 'rbracket', value: ']' }); i++; continue; }
        if (ch === '^') { tokens.push({ type: 'caret', value: '^' }); i++; continue; }
        if (ch === '_') { tokens.push({ type: 'underscore', value: '_' }); i++; continue; }
        if (ch === ',') { tokens.push({ type: 'comma', value: ',' }); i++; continue; }
        if (ch === '|') { tokens.push({ type: 'operator', value: '|' }); i++; continue; }
        if (ch === '!') { tokens.push({ type: 'operator', value: '!' }); i++; continue; }

        // Skip unknown characters
        i++;
    }

    return tokens;
}

// ─── Token → DSL Converter ───────────────────────────────────

function convertTokens(tokens: Token[]): string {
    let pos = 0;

    function peek(): Token | null {
        return pos < tokens.length ? tokens[pos] : null;
    }

    function next(): Token | null {
        return pos < tokens.length ? tokens[pos++] : null;
    }

    function readBraceGroup(): string {
        const t = peek();
        if (!t || t.type !== 'lbrace') return '';
        next(); // consume {
        let depth = 1;
        const inner: Token[] = [];
        while (pos < tokens.length && depth > 0) {
            const tk = tokens[pos];
            if (tk.type === 'lbrace') depth++;
            if (tk.type === 'rbrace') depth--;
            if (depth > 0) inner.push(tk);
            pos++;
        }
        return convertTokens(inner);
    }

    function readBracketGroup(): string {
        const t = peek();
        if (!t || t.type !== 'lbracket') return '';
        next(); // consume [
        let depth = 1;
        const inner: Token[] = [];
        while (pos < tokens.length && depth > 0) {
            const tk = tokens[pos];
            if (tk.type === 'lbracket') depth++;
            if (tk.type === 'rbracket') depth--;
            if (depth > 0) inner.push(tk);
            pos++;
        }
        return convertTokens(inner);
    }

    let result = '';

    while (pos < tokens.length) {
        const t = next()!;

        // Handle LaTeX commands
        if (t.type === 'command') {
            const cmd = t.value;

            // Constants
            if (LATEX_CONST_MAP[cmd]) {
                result += LATEX_CONST_MAP[cmd];
                continue;
            }

            // \frac{a}{b} → (a)/(b)
            if (cmd === '\\frac') {
                const num = readBraceGroup();
                const den = readBraceGroup();
                result += `(${num})/(${den})`;
                continue;
            }

            // \sqrt[n]{x} or \sqrt{x}
            if (cmd === '\\sqrt') {
                const nextTk = peek();
                if (nextTk && nextTk.type === 'lbracket') {
                    const nthRoot = readBracketGroup();
                    const content = readBraceGroup();
                    result += `(${content})^(1/(${nthRoot}))`;
                } else {
                    const content = readBraceGroup();
                    result += `sqrt(${content})`;
                }
                continue;
            }

            // Function commands: \sin, \cos, etc.
            if (LATEX_FUNC_MAP[cmd]) {
                const funcName = LATEX_FUNC_MAP[cmd];

                // Check for power: \sin^{2}(x) → sin(x)^(2)
                const nextTk = peek();
                let powerExpr = '';
                if (nextTk && nextTk.type === 'caret') {
                    next(); // consume ^
                    const pk = peek();
                    if (pk && pk.type === 'lbrace') {
                        powerExpr = readBraceGroup();
                    } else if (pk && (pk.type === 'number' || pk.type === 'variable')) {
                        powerExpr = next()!.value;
                    }
                }

                // Read the argument
                const argTk = peek();
                let arg: string;
                if (argTk && argTk.type === 'lbrace') {
                    arg = readBraceGroup();
                } else if (argTk && argTk.type === 'lparen') {
                    // Read until matching )
                    next(); // consume (
                    let depth = 1;
                    const inner: Token[] = [];
                    while (pos < tokens.length && depth > 0) {
                        const tk = tokens[pos];
                        if (tk.type === 'lparen') depth++;
                        if (tk.type === 'rparen') depth--;
                        if (depth > 0) inner.push(tk);
                        pos++;
                    }
                    arg = convertTokens(inner);
                } else if (argTk && (argTk.type === 'variable' || argTk.type === 'number')) {
                    arg = next()!.value;
                } else {
                    arg = '';
                }

                if (powerExpr) {
                    result += `${funcName}(${arg})^(${powerExpr})`;
                } else {
                    result += `${funcName}(${arg})`;
                }
                continue;
            }

            // \operatorname{name} → name
            if (cmd === '\\operatorname') {
                const name = readBraceGroup();
                result += name;
                continue;
            }

            // Unknown command — try passing through
            continue;
        }

        // Numbers and variables pass through
        if (t.type === 'number' || t.type === 'variable') {
            result += t.value;
            continue;
        }

        // Operators
        if (t.type === 'operator') {
            result += t.value;
            continue;
        }

        // Power: ^
        if (t.type === 'caret') {
            const nextTk = peek();
            if (nextTk && nextTk.type === 'lbrace') {
                const content = readBraceGroup();
                result += `^(${content})`;
            } else if (nextTk && (nextTk.type === 'number' || nextTk.type === 'variable')) {
                result += `^${next()!.value}`;
            }
            continue;
        }

        // Subscript: _ (usually ignored for variable names or treated as concatenation)
        if (t.type === 'underscore') {
            const nextTk = peek();
            if (nextTk && nextTk.type === 'lbrace') {
                // e.g., x_{12} → x12
                const sub = readBraceGroup();
                result += sub;
            } else if (nextTk && (nextTk.type === 'number' || nextTk.type === 'variable')) {
                result += next()!.value;
            }
            continue;
        }

        // Parentheses
        if (t.type === 'lparen') { result += '('; continue; }
        if (t.type === 'rparen') { result += ')'; continue; }

        // Braces (as grouping if not consumed by commands)
        if (t.type === 'lbrace') { result += '('; continue; }
        if (t.type === 'rbrace') { result += ')'; continue; }

        // Comma
        if (t.type === 'comma') { result += ','; continue; }
    }

    return result;
}

// ─── Implicit Multiplication ─────────────────────────────────

function addImplicitMultiplication(expr: string): string {
    // Tokenize the DSL expression into meaningful segments
    // and add * where implicit multiplication is needed

    let result = '';
    let i = 0;

    while (i < expr.length) {
        result += expr[i];
        i++;

        if (i >= expr.length) break;

        const prev = expr[i - 1];
        const curr = expr[i];

        const needsMul = (
            // digit followed by letter: 2x → 2*x
            (/\d/.test(prev) && /[a-zA-Z]/.test(curr)) ||
            // digit followed by (: 2( → 2*( BUT NOT for function names like log10(
            (/\d/.test(prev) && curr === '(' && !isFunctionBefore(expr, i - 1)) ||
            // ) followed by letter: )x → )*x
            (prev === ')' && /[a-zA-Z]/.test(curr)) ||
            // ) followed by (: )( → )*(
            (prev === ')' && curr === '(') ||
            // ) followed by digit: )2 → )*2
            (prev === ')' && /\d/.test(curr)) ||
            // letter followed by (: x( → x*( BUT NOT for function names
            (/[a-zA-Z]/.test(prev) && curr === '(' && !isFunctionBefore(expr, i - 1))
        );

        if (needsMul) {
            result += '*';
        }
    }

    return result;
}

/**
 * Check if the characters ending at position `end` form a known function name
 */
function isFunctionBefore(expr: string, end: number): boolean {
    // Read backwards to get the word
    let start = end;
    while (start > 0 && /[a-zA-Z0-9]/.test(expr[start - 1])) {
        start--;
    }
    const word = expr.substring(start, end + 1);
    return KNOWN_FUNCTIONS.has(word);
}

// ─── Cleanup ─────────────────────────────────────────────────

function cleanupExpr(expr: string): string {
    let s = expr;

    // Handle standalone `e^(...)` → `exp(...)`
    // Only match when `e` is standalone (not part of a word)
    s = s.replace(/(?<![a-zA-Z])e\*?\^(\([^)]*\))/g, 'exp$1');
    s = s.replace(/(?<![a-zA-Z])e\*?\^([0-9a-zA-Z])/g, 'exp($1)');

    // Clean up double operators
    s = s.replace(/\*\*/g, '^');
    s = s.replace(/\+\+/g, '+');
    s = s.replace(/--/g, '+');
    s = s.replace(/\+-/g, '-');
    s = s.replace(/-\+/g, '-');

    // Remove trailing operators
    s = s.replace(/[+\-*/^]+$/, '');

    return s;
}
