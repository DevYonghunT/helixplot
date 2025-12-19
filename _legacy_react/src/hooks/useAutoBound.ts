import { useMemo } from 'react';
import type { SampleResult } from '../core/types';

export function useAutoBound(data: SampleResult) {
    return useMemo(() => {
        if (!data.points.length) return { bound: 5, center: [0, 0, 0] as [number, number, number] };

        // 1. Calculate min/max
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        let minZ = Infinity, maxZ = -Infinity;

        // Filter valid points and outliers
        // Simple outlier filter: skip if absolute value > 1000 (just safety)
        const SAFE_LIMIT = 1000;

        for (const p of data.points) {
            if (Math.abs(p.x) < SAFE_LIMIT) {
                if (p.x < minX) minX = p.x;
                if (p.x > maxX) maxX = p.x;
            }
            if (Math.abs(p.y) < SAFE_LIMIT) {
                if (p.y < minY) minY = p.y;
                if (p.y > maxY) maxY = p.y;
            }
            if (Math.abs(p.z) < SAFE_LIMIT) {
                if (p.z < minZ) minZ = p.z;
                if (p.z > maxZ) maxZ = p.z;
            }
        }

        // Handle case where all points were outliers or empty
        if (minX === Infinity) return { bound: 5, center: [0, 0, 0] as [number, number, number] };

        const rangeX = maxX - minX;
        const rangeY = maxY - minY;
        const rangeZ = maxZ - minZ;

        const maxRange = Math.max(rangeX, rangeY, rangeZ);

        // Center of the bounding box
        const cx = (minX + maxX) / 2;
        const cy = (minY + maxY) / 2;
        const cz = (minZ + maxZ) / 2;

        // Add padding (1.25x)
        // Clamp min bound to 1 to avoid tiny planes
        const bound = Math.max(1, maxRange * 0.75);

        return { bound, center: [cx, cy, cz] as [number, number, number] };
    }, [data]);
}
