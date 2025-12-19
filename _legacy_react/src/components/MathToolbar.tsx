

const TOOLS = [
    { label: "/", insert: "()/()", move: -4, desc: "Fraction" },
    { label: "^", insert: "^()", move: -1, desc: "Power" },
    { label: "exp", insert: "exp()", move: -1, desc: "Exponential" },
    { label: "log", insert: "log()", move: -1, desc: "Logarithm" },
    { label: "sqrt", insert: "sqrt()", move: -1, desc: "Square Root" },
    { label: "π", insert: "3.1415926", move: 0, desc: "Pi" },
    { label: "i", insert: "i", move: 0, desc: "Imaginary" },
    { label: "sin", insert: "sin()", move: -1, desc: "Sine" },
    { label: "cos", insert: "cos()", move: -1, desc: "Cosine" },
    { label: "tan", insert: "tan()", move: -1, desc: "Tangent" },
];

export function MathToolbar({ onInsert }: { onInsert: (text: string, moveCursor?: number) => void }) {
    return (
        <div className="flex gap-1 overflow-x-auto py-2 mb-1 border-b border-[var(--border)] no-scrollbar">
            {TOOLS.map((tool) => (
                <button
                    key={tool.label}
                    onClick={() => onInsert(tool.insert, tool.move)}
                    title={tool.desc}
                    className="h-7 px-2.5 min-w-[32px] rounded-lg bg-[var(--bg)] border border-[var(--border)] text-xs font-medium hover:bg-[var(--accent)] hover:text-white hover:border-transparent transition-colors whitespace-nowrap"
                >
                    {tool.label}
                </button>
            ))}
        </div>
    );
}
