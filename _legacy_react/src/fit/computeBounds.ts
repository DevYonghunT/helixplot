export interface Bounds3D {
    minX: number; maxX: number;
    minY: number; maxY: number;
    minZ: number; maxZ: number;
    rx: number; ry: number; rz: number;
    cx: number; cy: number; cz: number;
}

export interface Pt3 {
    x: number;
    y: number;
    z: number;
}

export function computeBounds(points: Pt3[]): Bounds3D {
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

    for (const p of points) {
        if (!Number.isFinite(p.x) || !Number.isFinite(p.y) || !Number.isFinite(p.z)) continue;
        if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y;
        if (p.z < minZ) minZ = p.z; if (p.z > maxZ) maxZ = p.z;
    }

    // fallback
    if (!Number.isFinite(minX)) {
        minX = -1; maxX = 1;
        minY = -1; maxY = 1;
        minZ = -1; maxZ = 1;
    }

    // Ensure non-zero size
    const rxRaw = Math.max(1e-6, maxX - minX);
    const ryRaw = Math.max(1e-6, maxY - minY);
    const rzRaw = Math.max(1e-6, maxZ - minZ);

    const pad = 0.12; // 12% padding as requested

    return {
        minX, maxX, minY, maxY, minZ, maxZ,
        rx: rxRaw * (1 + pad),
        ry: ryRaw * (1 + pad),
        rz: rzRaw * (1 + pad),
        cx: (minX + maxX) / 2,
        cy: (minY + maxY) / 2,
        cz: (minZ + maxZ) / 2,
    };
}
