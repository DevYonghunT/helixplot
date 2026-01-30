import React, { useMemo, useEffect, useRef } from 'react';
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
    const materialRefs = useRef<any[]>([]);
    const prevTubesRef = useRef<THREE.TubeGeometry[]>([]);

    useFrame((state) => {
        for (const mat of materialRefs.current) {
            if (mat) mat.uTime = state.clock.elapsedTime;
        }
    });

    const { tubes, errors } = useMemo(() => {
        // Dispose previous geometries to prevent GPU memory leak
        for (const geom of prevTubesRef.current) {
            geom.dispose();
        }

        const tubes: THREE.TubeGeometry[] = [];
        const errors: THREE.Vector3[][] = [];

        let current: THREE.Vector3[] = [];
        let lastValidIdx = -1;

        data.points.forEach((p, i) => {
            if (data.validity[i]) {
                if (lastValidIdx !== -1 && (i - lastValidIdx) > 1) {
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
                    tubes.push(new THREE.TubeGeometry(curve, current.length * 2, 0.06, 5, false));
                }
                current = [];
            }
        });

        if (current.length > 1) {
            const curve = new THREE.CatmullRomCurve3(current);
            tubes.push(new THREE.TubeGeometry(curve, current.length * 2, 0.06, 5, false));
        }

        prevTubesRef.current = tubes;
        return { tubes, errors };
    }, [data]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            for (const geom of prevTubesRef.current) {
                geom.dispose();
            }
        };
    }, []);

    // Reset material refs array length in useEffect to avoid mutation during render
    useEffect(() => {
        materialRefs.current.length = tubes.length;
    }, [tubes.length]);

    return (
        <group>
            {tubes.map((geom, i) => (
                <mesh key={`tube-${i}-${data.revision ?? 0}`} geometry={geom}>
                    {/* @ts-ignore */}
                    <curveShaderMaterial
                        ref={(el: any) => { materialRefs.current[i] = el; }}
                        uColor={new THREE.Color(color || "#6366f1")}
                        uTracerColor={new THREE.Color("#ffffff")}
                        uOpacity={opacity}
                        transparent={opacity < 1}
                    />
                </mesh>
            ))}

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

// Height-based colormap (viridis-inspired)
function heightToColor(t: number): [number, number, number] {
    // t is 0..1 representing normalized height
    const clamped = Math.max(0, Math.min(1, t));
    // Purple → Blue → Cyan → Green → Yellow
    if (clamped < 0.25) {
        const s = clamped / 0.25;
        return [0.27 * (1 - s) + 0.13 * s, 0.0 * (1 - s) + 0.37 * s, 0.53 * (1 - s) + 0.72 * s];
    } else if (clamped < 0.5) {
        const s = (clamped - 0.25) / 0.25;
        return [0.13 * (1 - s) + 0.12 * s, 0.37 * (1 - s) + 0.62 * s, 0.72 * (1 - s) + 0.60 * s];
    } else if (clamped < 0.75) {
        const s = (clamped - 0.5) / 0.25;
        return [0.12 * (1 - s) + 0.55 * s, 0.62 * (1 - s) + 0.78 * s, 0.60 * (1 - s) + 0.22 * s];
    } else {
        const s = (clamped - 0.75) / 0.25;
        return [0.55 * (1 - s) + 0.99 * s, 0.78 * (1 - s) + 0.91 * s, 0.22 * (1 - s) + 0.15 * s];
    }
}

interface SurfaceRendererProps extends RendererProps {
    wireframe?: boolean;
    surfaceOpacity?: number;
    showWireframeOverlay?: boolean;
}

export const SurfaceRenderer: React.FC<SurfaceRendererProps> = ({
    data,
    wireframe = false,
    surfaceOpacity = 1.0,
    showWireframeOverlay = true,
}) => {
    const prevGeomRef = useRef<THREE.BufferGeometry | null>(null);

    const geometry = useMemo(() => {
        // Dispose previous geometry
        if (prevGeomRef.current) {
            prevGeomRef.current.dispose();
            prevGeomRef.current = null;
        }

        if (!data.grid || data.grid.length === 0) return null;

        const Nx = data.grid.length;
        const Ny = data.grid[0].length;

        const positions: number[] = [];
        const colors: number[] = [];
        const indices: number[] = [];

        // Find z range for color mapping
        let zMin = Infinity, zMax = -Infinity;
        for (let i = 0; i < Nx; i++) {
            for (let j = 0; j < Ny; j++) {
                const z = data.grid[i][j].z;
                if (isFinite(z)) {
                    if (z < zMin) zMin = z;
                    if (z > zMax) zMax = z;
                }
            }
        }
        const zRange = zMax - zMin || 1;

        for (let i = 0; i < Nx; i++) {
            for (let j = 0; j < Ny; j++) {
                const p = data.grid[i][j];
                const validZ = isFinite(p.z);
                positions.push(validZ ? p.x : 0, validZ ? p.y : 0, validZ ? p.z : 0);

                // Height-based vertex color
                const t = validZ ? (p.z - zMin) / zRange : 0.5;
                const [r, g, b] = heightToColor(t);
                colors.push(r, g, b);
            }
        }

        for (let i = 0; i < Nx - 1; i++) {
            for (let j = 0; j < Ny - 1; j++) {
                const a = i * Ny + j;
                const b = (i + 1) * Ny + j;
                const c = i * Ny + (j + 1);
                const d = (i + 1) * Ny + (j + 1);

                const pA = data.grid[i][j];
                const pB = data.grid[i + 1][j];
                const pC = data.grid[i][j + 1];
                const pD = data.grid[i + 1][j + 1];

                if (isFinite(pA.z) && isFinite(pB.z) && isFinite(pC.z)) {
                    indices.push(a, b, c);
                }
                if (isFinite(pB.z) && isFinite(pC.z) && isFinite(pD.z)) {
                    indices.push(c, b, d);
                }
            }
        }

        const geom = new THREE.BufferGeometry();
        geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geom.setIndex(indices);
        geom.computeVertexNormals();
        prevGeomRef.current = geom;
        return geom;
    }, [data]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            prevGeomRef.current?.dispose();
        };
    }, []);

    if (!geometry) return null;

    return (
        <group>
            {/* Main surface with vertex colors */}
            <mesh geometry={geometry}>
                <meshStandardMaterial
                    side={THREE.DoubleSide}
                    vertexColors
                    wireframe={wireframe}
                    transparent={surfaceOpacity < 1}
                    opacity={surfaceOpacity}
                    metalness={0.3}
                    roughness={0.4}
                />
            </mesh>

            {/* Wireframe overlay */}
            {showWireframeOverlay && !wireframe && (
                <mesh geometry={geometry}>
                    <meshBasicMaterial
                        side={THREE.DoubleSide}
                        wireframe
                        color="#000000"
                        transparent
                        opacity={0.08}
                        depthWrite={false}
                    />
                </mesh>
            )}
        </group>
    );
};
