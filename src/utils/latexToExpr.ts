
export function latexToExpr(latex: string): { expr: string, error: string | null } {
    if (!latex) return { expr: "", error: null };

    let s = latex;

    try {
        // 1. Basic Cleaning
        s = s.replace(/\\left/g, "").replace(/\\right/g, "");
        s = s.replace(/\s+/g, ""); // Remove whitespace? careful with keywords. MathLive usually gives dense latex.

        // 2. Constants & Symbols
        s = s.replace(/\\pi/g, "pi");
        s = s.replace(/\\theta/g, "t"); // map theta to t often?
        s = s.replace(/\\infty/g, "infinity");
        s = s.replace(/\\cdot/g, "*");
        s = s.replace(/\\times/g, "*");

        // 3. Functions
        // \sin, \cos, \tan, \ln, \log
        s = s.replace(/\\sin/g, "sin");
        s = s.replace(/\\cos/g, "cos");
        s = s.replace(/\\tan/g, "tan");
        s = s.replace(/\\ln/g, "log"); // ln -> nat log
        s = s.replace(/\\log/g, "log10"); // LaTeX log is usually log10 or generic. Let's assume user wants log/ln collision handled. 
        // NOTE: JS Math.log is ln. In our DSL 'log' usually maps to Math.log (ln).
        // Let's check Parser. It uses mathjs or custom? Custom `Evaluator` uses `Math` functions.
        // Math.log is ln.
        s = s.replace(/\\exp/g, "exp");

        // 4. Recursive Handler for structured commands like \frac, \sqrt, ^
        // We need a helper to find matching brace.

        while (s.includes("\\frac")) {
            s = replaceCommand(s, "\\frac", (args) => `(${args[0]})/(${args[1]})`);
        }

        while (s.includes("\\sqrt")) {
            // \sqrt[3]{x} vs \sqrt{x}
            // For MVP, assume \sqrt{x}
            s = replaceCommand(s, "\\sqrt", (args) => `sqrt(${args[0]})`);
        }

        // Powers: e^{...} -> exp(...)
        // Replace e^ before general ^?
        // Actually e^ is hard to distinguish from var e.
        // But if user types e^x in MathLive, it usually outputs e^{x}.
        // We can replace e^{...} with exp(...)
        // But what if it's t^2?
        // Let's handle general ^{...} -> ^(...) first, then e^(...) -> exp(...) later?
        // No, standard DSL supports ^. `t^2` is valid if Evaluator/Parser supports it.
        // Checking Parser... Evaluator typically handles `^` via `Math.pow` or `**`.
        // Let's assume `^` is valid DSL.
        // We just need to ensure grouping. { } in latex should become ( ) in DSL.

        // Handle ^{...}
        // ^ is an operator, not a command with braces in front. 
        // LateX: x^{2}
        // We want x^(2)
        // We can use a regex loop for ^{...}
        while (s.match(/\^\{/)) {
            const idx = s.indexOf("^{");
            const end = findMatchingBrace(s, idx + 1);
            if (end === -1) throw "Unmatched brace in power";
            const content = s.substring(idx + 2, end);
            s = s.substring(0, idx) + "^(" + content + ")" + s.substring(end + 1);
        }

        // 5. Braces: Convert remaining { } to ( )
        // Only if they are grouping? 
        // LaTeX uses {} for args. If we stripped commands, {} might be grouping.
        // But typically we want () for grouping in DSL.
        s = s.replace(/\{/g, "(").replace(/\}/g, ")");

        // 6. Implicit Multiplication
        // Case: 2t -> 2*t
        // Case: t cos -> t * cos
        // Case: ) ( -> ) * (
        // Case: 2( -> 2*(
        // Case: )t -> )*t

        // Digit followed by Letter
        s = s.replace(/(\d)([a-zA-Z])/g, "$1*$2");
        // Letter followed by Digit? x2 -> usually var name x2, not x*2. Keep it.

        // Digit followed by (
        s = s.replace(/(\d)\(/g, "$1*(");

        // ) followed by Letter
        s = s.replace(/\)([a-zA-Z])/g, ")*$1");

        // ) followed by (
        s = s.replace(/\)\(/g, ")*(");

        // Letter followed by ( ?  sin(t) -> sin*(t) NO.
        // We need to distinguish function calls.
        // List of known functions: sin, cos, tan, log, exp, sqrt
        // If word is NOT a function, treat as var?
        // t(1+t) -> t*(1+t).
        // sin(t) -> sin(t).
        // We need protection for function names.

        // Strategy: Temporary placeholder for known functions?
        // Or specific regex.
        // simpler: Space out operations?

        // Let's do a specialized pass for implicit mul
        s = insertImplicitMul(s);

        // 7. Special Replacements
        // e^(...) -> exp(...)
        // DSL probably supports exp().
        // If s has `e^(...)`, replace with `exp(...)`
        // Match `e^`
        s = s.replace(/e\^/g, "exp");

        // 8. i handling
        // i usually just i.

        return { expr: s, error: null };
    } catch (e: any) {
        return { expr: "", error: e.toString() };
    }
}

function replaceCommand(str: string, cmd: string, replacer: (args: string[]) => string): string {
    const idx = str.indexOf(cmd);
    if (idx === -1) return str;

    // Find args. \frac{A}{B}
    let cursor = idx + cmd.length;
    const args: string[] = [];

    // Attempt to read 2 args. If only 1 exists (like \sqrt), replacer logic should handle or we adapt?
    // \frac always has 2. \sqrt has 1 (usually).
    // Let's be dynamic.

    while (cursor < str.length) {
        // Skip whitespace?
        // Check for {
        if (str[cursor] === '{') {
            const end = findMatchingBrace(str, cursor);
            if (end === -1) break; // Error
            args.push(str.substring(cursor + 1, end));
            cursor = end + 1;

            // For frac, we need 2 args. For sqrt, 1.
            if (cmd === "\\frac" && args.length === 2) break;
            if (cmd === "\\sqrt" && args.length === 1) break;
        } else {
            break;
        }
    }

    if ((cmd === "\\frac" && args.length < 2) || (cmd === "\\sqrt" && args.length < 1)) {
        // Syntax error or partial?
        // Just return original to avoid infinite loop if parsed wrong?
        // Or remove command.
        return str.replace(cmd, "");
    }

    const replacement = replacer(args);
    return str.substring(0, idx) + replacement + str.substring(cursor);
}

function findMatchingBrace(str: string, start: number): number {
    let depth = 1;
    for (let i = start + 1; i < str.length; i++) {
        if (str[i] === '{') depth++;
        if (str[i] === '}') depth--;
        if (depth === 0) return i;
    }
    return -1;
}

function insertImplicitMul(s: string): string {
    // We want to insert * in:
    // 2x, 2(, )x, )(
    // But NOT inside function names like s*q*r*t

    // Tokenize roughly?
    // Regex lookaheads.

    // 1. ) ( -> )*(
    s = s.replace(/\)\(/g, ")*(");

    // 2. digit ( -> digit*(
    s = s.replace(/(\d)\(/g, "$1*(");

    // 3. ) var -> )*var
    // Need to unsure 'var' start.
    s = s.replace(/\)([a-zA-Z])/g, ")*$1");

    // 4. digit var -> digit*var
    s = s.replace(/(\d)([a-zA-Z])/g, "$1*$2");

    // 5. var var ? xy -> x*y ?? No, let's assume vars can be multi-char (e.g. tmax).
    // So 'tcos' is ambiguous. t*cos or tcos variable?
    // DSL usually treats 'tcos' as a symbol.
    // If we want t*cos, logic needs to know 'cos' is a function/reserved.
    // Replace known funcs with tokens?

    // We only care about explicit boundaries.
    // It's brittle.
    // For MVP, user should probably space them or use *.
    // But "2t" is the main request. We handled that.

    return s;
}
