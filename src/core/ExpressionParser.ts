import type { Definition, ParseResult } from './types';

export class ExpressionParser {
    static parse(text: string): ParseResult {
        const definitions: Record<string, Definition> = {};
        const errors: string[] = [];

        const lines = text.split('\n');

        lines.forEach((line, index) => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) return;

            try {
                const def = this.parseLine(trimmed);
                if (def) {
                    // Overwrite if exists, simple logic for MVP
                    definitions[def.target] = def;
                }
            } catch (e: any) {
                errors.push(`Line ${index + 1}: ${e.message}`);
            }
        });

        return { definitions, errors };
    }

    private static parseLine(line: string): Definition {
        // Basic assignment: lhs = rhs
        const eqIndex = line.indexOf('=');
        if (eqIndex === -1) {
            throw new Error("Missing '=' in assignment");
        }

        const lhs = line.substring(0, eqIndex).trim();
        const rhs = line.substring(eqIndex + 1).trim();

        // Parse LHS for function signature e.g. f(t) or x or z(x,y)
        // Regex for "name" and optional "(args)"
        const lhsMatch = lhs.match(/^([A-Za-z_][A-Za-z0-9_]*)(?:\s*\(([^)]+)\))?$/);

        if (!lhsMatch) {
            throw new Error(`Invalid left-hand side: ${lhs}`);
        }

        const target = lhsMatch[1];
        const paramsStr = lhsMatch[2];
        const params = paramsStr ? paramsStr.split(',').map(s => s.trim()) : [];

        // Check if RHS is a tuple/vector (starts with '(' and ends with ')')
        // Simple check, real parsing handles nested parens but for top level tuple:
        const isVector = rhs.startsWith('(') && rhs.endsWith(')') && rhs.includes(',');

        return {
            raw: line,
            target,
            params,
            expr: rhs,
            isVector
        };
    }
}
