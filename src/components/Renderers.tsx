import React, { useMemo } from 'react';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import type { SampleResult } from '../core/types';

interface RendererProps {
    data: SampleResult;
    color?: string;
    opacity?: number;
}

import { useFrame } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';

// Custom Shader Material for dynamic glow and tracer
const CurveShaderMaterial = shaderMaterial(
    {
        uTime: 0,
        uColor: new THREE.Color("#6366f1"),
        uTracerColor: new THREE.Color("#ffffff"),
        uOpacity: 1.0
    },
    // Vertex Shader
    `
    varying vec2 vUv;
    varying float vErr;
    
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
    `,
    // Fragment Shader
    `
    uniform float uTime;
    uniform vec3 uColor;
    uniform vec3 uTracerColor;
    uniform float uOpacity;
    varying vec2 vUv;

    void main() {
        // Base color
        vec3 color = uColor;

        // Tracer effect (looping every 1.5s roughly)
        // vUv.x is 0..1 along the tube
        float t = mod(uTime * 0.5, 1.2) - 0.1; // -0.1 to 1.1
        float dist = abs(vUv.x - t);
        
        // Sharp glow
        float glow = exp(-pow(dist * 20.0, 2.0));
        color = mix(color, uTracerColor, glow * 0.8);

        // Simple edge darkening for tube "volume" feel
        // vUv.y is 0..1 around the tube
        float rim = abs(vUv.y - 0.5) * 2.0;
        color *= (0.5 + 0.5 * (1.0 - pow(rim, 3.0)));

        gl_FragColor = vec4(color, uOpacity);
    }
    `
);
// Extend to make it available in JSX
import { extend } from '@react-three/fiber';
extend({ CurveShaderMaterial });

// Declaration for TS
declare global {
    namespace JSX {
        interface IntrinsicElements {
            curveShaderMaterial: any;
        }
    }
}

export const CurveRenderer: React.FC<RendererProps> = ({ data, color, opacity = 1 }) => {
    const materialRef = React.useRef<any>(null);

    useFrame((state) => {
        if (materialRef.current) {
            materialRef.current.uTime = state.clock.elapsedTime;
        }
    });

    const { tubes, errors } = useMemo(() => {
        const tubes: THREE.TubeGeometry[] = [];
        const errors: THREE.Vector3[][] = [];

        let current: THREE.Vector3[] = [];

        // Error range tracker
        let lastValidIdx = -1;

        data.points.forEach((p, i) => {
            if (data.validity[i]) {
                // If we jumped over invalid points, add error segment
                if (lastValidIdx !== -1 && (i - lastValidIdx) > 1) {
                    // Start of error gap: lastValidIdx
                    // End of error gap: i
                    // Visualizing the gap line
                    const startP = data.points[lastValidIdx];
                    const endP = p;
                    errors.push([
                        new THREE.Vector3(startP.x, startP.y, startP.z),
                        new THREE.Vector3(endP.x, endP.y, endP.z)
                    ]);
                }

                current.push(new THREE.Vector3(p.x, p.y, p.z));
                lastValidIdx = i;
            } else {
                if (current.length > 1) {
                    const curve = new THREE.CatmullRomCurve3(current);
                    // LOD: Adjust segments based on length? For now fixed for stability
                    tubes.push(new THREE.TubeGeometry(curve, current.length * 2, 0.06, 5, false));
                }
                current = [];
            }
        });

        if (current.length > 1) {
            const curve = new THREE.CatmullRomCurve3(current);
            tubes.push(new THREE.TubeGeometry(curve, current.length * 2, 0.06, 5, false));
        }

        return { tubes, errors };
    }, [data]);

    return (
        <group>
            {/* Valid Segments with Tubes */}
            {tubes.map((geom, i) => (
                <mesh key={`tube-${i}`} geometry={geom}>
                    {/* @ts-ignore */}
                    <curveShaderMaterial
                        ref={materialRef}
                        uColor={new THREE.Color(color || "#6366f1")}
                        uTracerColor={new THREE.Color("#ffffff")}
                        uOpacity={opacity}
                        transparent={opacity < 1}
                    />
                </mesh>
            ))}

            {/* Error Indicators (Red Dashes) */}
            {errors.map((seg, i) => (
                <Line
                    key={`err-${i}`}
                    points={seg}
                    color="#ef4444"
                    lineWidth={2}
                    dashed
                    dashScale={2}
                    gapSize={1}
                />
            ))}

            {/* Error Markers (Spheres at breakdown points) */}
            {errors.map((seg, i) => (
                <group key={`mark-${i}`}>
                    <mesh position={seg[0]}>
                        <sphereGeometry args={[0.08, 8, 8]} />
                        <meshBasicMaterial color="#ef4444" />
                    </mesh>
                    <mesh position={seg[1]}>
                        <sphereGeometry args={[0.08, 8, 8]} />
                        <meshBasicMaterial color="#ef4444" />
                    </mesh>
                </group>
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
