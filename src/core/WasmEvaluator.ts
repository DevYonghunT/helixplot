// WasmEvaluator.ts
// Bridge to the Rust WASM module

// Type definition for the WASM module since it might not be built yet
type WasmModule = {
    generate_points: (mode: string, t_min: number, t_max: number, steps: number) => Float32Array;
};

let wasmModule: WasmModule | null = null;

export const loadWasm = async () => {
    try {
        // Dynamic import to avoid breaking build if file missing
        // @ts-ignore
        wasmModule = await import('../../helix-core-rs/pkg/helix_core_rs');
    } catch (e) {
        console.warn("WASM module not found. Run 'wasm-pack build' inside helix-core-rs.");
    }
};

export class WasmEvaluator {
    static isReady() {
        return wasmModule !== null;
    }

    static generatePoints(mode: string, tRange: [number, number], steps: number) {
        if (!wasmModule) throw new Error("WASM not loaded");

        const start = performance.now();
        const flatArray = wasmModule.generate_points(mode, tRange[0], tRange[1], steps);
        const end = performance.now();

        console.log(`[WASM] generate_points('${mode}') took ${(end - start).toFixed(3)}ms`);

        // Convert Float32Array [x, y, z, x, y, z...] to {x,y,z}[]
        // For max performance in Three.js we should use BufferGeometry directly with this array!
        // But to match current Sampler interface:
        const points = [];
        for (let i = 0; i < flatArray.length; i += 3) {
            points.push({
                x: flatArray[i],
                y: flatArray[i + 1],
                z: flatArray[i + 2]
            });
        }
        return points;
    }
}
