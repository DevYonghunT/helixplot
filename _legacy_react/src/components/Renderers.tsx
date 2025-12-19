import React, { useMemo } from 'react';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import type { SampleResult } from '../core/types';

interface RendererProps {
    data: SampleResult;
    color?: string;
    opacity?: number;
}

export const CurveRenderer: React.FC<RendererProps> = ({ data, color, opacity = 1 }) => {
    const segments = useMemo(() => {
        const list: THREE.Vector3[][] = [];
        let current: THREE.Vector3[] = [];

        data.points.forEach((p, i) => {
            if (data.validity[i]) {
                current.push(new THREE.Vector3(p.x, p.y, p.z));
            } else {
                if (current.length > 1) list.push(current);
                current = [];
            }
        });
        if (current.length > 1) list.push(current);

        return list;
    }, [data]);

    return (
        <group>
            {segments.map((seg, i) => (
                <Line
                    key={i}
                    points={seg}
                    color={color || "#111827"} // Default to Ink Color
                    lineWidth={2}
                    transparent={opacity < 1}
                    opacity={opacity}
                />
            ))}
        </group>
    );
};

export const SurfaceRenderer: React.FC<RendererProps> = ({ data }) => {
    // data.grid needs to be converted to Geometry
    // We can use a custom BufferGeometry

    const geometry = useMemo(() => {
        if (!data.grid || data.grid.length === 0) return null;

        const Nx = data.grid.length;
        const Ny = data.grid[0].length;

        const positions: number[] = [];
        const indices: number[] = [];

        // Flatten grid to positions
        for (let i = 0; i < Nx; i++) {
            for (let j = 0; j < Ny; j++) {
                const p = data.grid[i][j];
                // If nan, render as 0 but maybe skip index?
                // For MVP, render 0 if NaN or skip triangle?
                // Skip triangle logic is complex. Let's just create vertices.
                positions.push(isNaN(p.z) ? 0 : p.x, isNaN(p.z) ? 0 : p.y, isNaN(p.z) ? 0 : p.z);
            }
        }

        // Generate indices for triangles
        for (let i = 0; i < Nx - 1; i++) {
            for (let j = 0; j < Ny - 1; j++) {
                const a = i * Ny + j;
                const b = (i + 1) * Ny + j;
                const c = i * Ny + (j + 1);
                const d = (i + 1) * Ny + (j + 1);

                // Check validity (not NaN)
                // If any vertex is NaN (we likely don't know from index alone unless we check z)
                // Optimization: Just push indices, let shader handle? 
                // Or verify:
                const pA = data.grid[i][j];
                const pB = data.grid[i + 1][j];
                const pC = data.grid[i][j + 1];
                const pD = data.grid[i + 1][j + 1];

                if (!isNaN(pA.z) && !isNaN(pB.z) && !isNaN(pC.z)) {
                    indices.push(a, b, c);
                }
                if (!isNaN(pB.z) && !isNaN(pC.z) && !isNaN(pD.z)) {
                    indices.push(c, b, d);
                }
            }
        }

        const geom = new THREE.BufferGeometry();
        geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geom.setIndex(indices);
        geom.computeVertexNormals();
        return geom;
    }, [data]);

    if (!geometry) return null;

    return (
        <mesh geometry={geometry}>
            <meshStandardMaterial side={THREE.DoubleSide} color="#7000ff" wireframe={false} metalness={0.5} roughness={0.2} />
        </mesh>
    );
};
