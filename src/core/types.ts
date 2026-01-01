export type Mode = 'auto' | 'curve' | 'complex' | 'surface' | 'implicit';

export interface Definition {
    raw: string;
    target: string; // name being assigned 'x', 'y', 'z', 'r', 'f', 'F'
    params: string[]; // ['t'] or ['x', 'y'] etc.
    expr: string; // The right hand side
    isVector: boolean; // true if expression is like (a,b,c)
}

export type DefinitionsMap = Record<string, Definition>;

export interface ParseResult {
    definitions: DefinitionsMap;
    errors: string[];
}

export interface RenderConfig {
    mode: Mode;
    tRange: [number, number];
    tSamples: number;
    // Surface config can be added later
    xRange?: [number, number];
    yRange?: [number, number];
    gridSize?: [number, number]; // [Nx, Ny]
}

export interface SampleResult {
    points: { x: number, y: number, z: number }[]; // For curve
    // For surface, we might need a grid or separate list
    grid?: { x: number, y: number, z: number }[][];
    validity: boolean[]; // For each point, is it valid (not NaN)?
    revision?: number; // Increment on every update to force 3D sync
}
