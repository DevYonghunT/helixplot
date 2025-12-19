import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, OrthographicCamera, PerspectiveCamera } from '@react-three/drei';
import clsx from 'clsx';
import * as THREE from 'three';
import type { SampleResult, Mode, RenderConfig } from '../core/types';
import type { PlaneTheme } from '../hooks/usePlaneTheme';
import { CurveRenderer, SurfaceRenderer } from './Renderers';
import { computeBounds } from '../fit/computeBounds';
import type { PlaybackRuntime } from '../hooks/usePlaybackRuntime';

interface ViewportProps {
    data: SampleResult;
    mode: Mode;
    type: '3d' | 'xy' | 'xz' | 'yz';
    className?: string;
    showDiagramElements?: boolean;
    valBound?: number; // Legacy bound, ignored for planes now
    valCenter?: [number, number, number]; // Legacy center
    planeTheme?: PlaneTheme;
    playbackRt?: PlaybackRuntime;
    config?: RenderConfig;
    driveClock?: boolean;
}

const DEFAULT_THEME_FALLBACK = {
    xy: { hex: "#3B82F6", alpha: 0.1 },
    xz: { hex: "#22C55E", alpha: 0.1 },
    yz: { hex: "#EF4444", alpha: 0.1 },
};

// Refactored ProjectionPlane with fixed Render Order & Material
const ProjectionPlane = React.forwardRef<THREE.Mesh, {
    position?: [number, number, number],
    rotation?: [number, number, number],
    size?: [number, number],
    color: string,
    alpha: number,
    visibleScale?: number
}>(({ position, rotation, size = [1, 1], color, alpha, visibleScale = 1 }, ref) => (
    <mesh ref={ref} position={position} rotation={rotation} renderOrder={1} scale={[size[0] * visibleScale, size[1] * visibleScale, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
            color={color}
            transparent
            opacity={alpha}
            side={THREE.DoubleSide}
            depthWrite={false}
            polygonOffset
            polygonOffsetFactor={1}
            polygonOffsetUnits={1}
        />
        <lineSegments renderOrder={2}>
            <edgesGeometry args={[new THREE.PlaneGeometry(1, 1)]} />
            <lineBasicMaterial color={color} transparent opacity={Math.min(1, alpha * 2 + 0.1)} depthWrite={false} />
        </lineSegments>
    </mesh>
));

// Inner Component to handle Scene Logic with useThree
const SceneContent = ({
    data, mode, type, showDiagramElements = false, themes, playbackRt, config, driveClock
}: ViewportProps & { themes: any }) => {
    const { camera, size } = useThree();
    const controlsRef = useRef<any>(null);

    const [fitReady, setFitReady] = useState(false);
    const is3D = type === '3d';

    // Refs for Dynamic Updates (Animation)
    const cursorMeshRef = useRef<THREE.Mesh>(null);
    const projXYRef = useRef<THREE.Mesh>(null);
    const projXZRef = useRef<THREE.Mesh>(null);
    const projYZRef = useRef<THREE.Mesh>(null);
    const lineXYRef = useRef<THREE.LineSegments>(null);
    const lineXZRef = useRef<THREE.LineSegments>(null);
    const lineYZRef = useRef<THREE.LineSegments>(null);

    // Staging & Layout Logic
    const { stagedData, finalExtent, center, planes } = React.useMemo(() => {
        // Default returns for empty data
        if (!data.points || data.points.length < 2) {
            return {
                stagedData: data,
                finalExtent: 10,
                center: new THREE.Vector3(0, 0, 0),
                planes: {
                    xy: { pos: [0, 0, 0] as [number, number, number], size: [10, 10] as [number, number] },
                    xz: { pos: [0, 0, 0] as [number, number, number], size: [10, 10] as [number, number] },
                    yz: { pos: [0, 0, 0] as [number, number, number], size: [10, 10] as [number, number] }
                }
            };
        }

        const b = computeBounds(data.points);
        const maxAbs = Math.max(
            Math.abs(b.minX), Math.abs(b.maxX),
            Math.abs(b.minY), Math.abs(b.maxY),
            Math.abs(b.minZ), Math.abs(b.maxZ)
        );
        const rawExtent = maxAbs * 2.2;
        const ox = rawExtent * 0.15;
        const oy = rawExtent * 0.15;
        const oz = rawExtent * 0.35;

        const stagedPoints = data.points.map(p => ({
            x: p.x + ox,
            y: p.y + oy,
            z: p.z + oz
        }));

        const sData = { ...data, points: stagedPoints };

        // Remove parsed cursor usage from logic as we depend on playbackRt or runtime calculation now?
        // Actually, if static (no playbackRt), we might want to show sCursor if it exists in data?
        // But the prompt says "Refactor: Remove all playback-related state... cursor... from useHelixState".
        // useHelixState might still have `cursor` if parsed from `useMemo` logic?
        // Let's assume for now we only show dynamic cursor from playbackRt.
        // Wait, if playback is PAUSED, playbackRt still has a position.
        // So we ALWAYS use playbackRt position if available.

        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        let minZ = Infinity, maxZ = -Infinity;
        for (const p of stagedPoints) {
            if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
            if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y;
            if (p.z < minZ) minZ = p.z; if (p.z > maxZ) maxZ = p.z;
        }

        const maxDist = Math.max(
            Math.abs(minX), Math.abs(maxX),
            Math.abs(minY), Math.abs(maxY),
            Math.abs(minZ), Math.abs(maxZ)
        );
        const fExtent = maxDist * 2.2;
        const c = new THREE.Vector3((minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2);

        const pad = 1.2;
        const widthX = (maxX - minX) * pad;
        const heightY = (maxY - minY) * pad;
        const widthZ = (maxZ - minZ) * pad;

        return {
            stagedData: sData,
            finalExtent: fExtent,
            center: c,
            planes: {
                xy: { pos: [(minX + maxX) / 2, (minY + maxY) / 2, 0] as [number, number, number], size: [widthX, heightY] as [number, number] },
                xz: { pos: [(minX + maxX) / 2, 0, (minZ + maxZ) / 2] as [number, number, number], size: [widthX, widthZ] as [number, number] },
                yz: { pos: [0, (minY + maxY) / 2, (minZ + maxZ) / 2] as [number, number, number], size: [widthZ, heightY] as [number, number] }
            }
        };
    }, [data.revision, data.points]);

    // High-Frequency Loop via Playback Runtime
    useFrame((_, delta) => {
        if (!playbackRt || !config || !stagedData.points || stagedData.points.length < 2) return;

        // Drive the Clock logic (only main viewport does this)
        if (driveClock) {
            playbackRt.step(delta, config.tRange[0], config.tRange[1]);
        }

        // Read current time
        const t = playbackRt.tRef.current;
        const [tMin, tMax] = config.tRange;
        const duration = tMax - tMin || 1;

        // Calculate U (0..1)
        const u = Math.max(0, Math.min(1, (t - tMin) / duration));

        // Interpolate Logic
        // TODO: Handle user loopT wrapping properly if different from duration
        // For now assume t maps linearly to index 0..N
        const idx = u * (stagedData.points.length - 1);
        const i = Math.floor(idx);
        const f = idx - i;
        const p1 = stagedData.points[i];
        const p2 = stagedData.points[Math.min(i + 1, stagedData.points.length - 1)];

        if (p1 && p2) {
            const px = p1.x + (p2.x - p1.x) * f;
            const py = p1.y + (p2.y - p1.y) * f;
            const pz = p1.z + (p2.z - p1.z) * f;

            // Update Cursor
            if (cursorMeshRef.current) {
                cursorMeshRef.current.position.set(px, py, pz);
                cursorMeshRef.current.visible = true;
            }

            // Update Diagram Elements (Projections)
            if (showDiagramElements && fitReady && is3D) {
                // XY
                if (projXYRef.current) projXYRef.current.position.set(px, py, 0);
                if (lineXYRef.current) {
                    lineXYRef.current.geometry.setFromPoints([
                        new THREE.Vector3(px, py, pz),
                        new THREE.Vector3(px, py, 0)
                    ]);
                    lineXYRef.current.computeLineDistances();
                    lineXYRef.current.visible = true;
                }

                // XZ
                if (projXZRef.current) projXZRef.current.position.set(px, 0, pz);
                if (lineXZRef.current) {
                    lineXZRef.current.geometry.setFromPoints([
                        new THREE.Vector3(px, py, pz),
                        new THREE.Vector3(px, 0, pz)
                    ]);
                    lineXZRef.current.computeLineDistances();
                    lineXZRef.current.visible = true;
                }

                // YZ
                if (projYZRef.current) projYZRef.current.position.set(0, py, pz);
                if (lineYZRef.current) {
                    lineYZRef.current.geometry.setFromPoints([
                        new THREE.Vector3(px, py, pz),
                        new THREE.Vector3(0, py, pz)
                    ]);
                    lineYZRef.current.computeLineDistances();
                    lineYZRef.current.visible = true;
                }
            }
        }
    });

    // Robust Fit Loop
    useEffect(() => {
        let raf = 0;
        const run = () => {
            // Robust Check: Wait for Data AND Canvas Size
            if (!stagedData.points || stagedData.points.length < 2 || size.width === 0 || size.height === 0) {
                raf = requestAnimationFrame(run);
                return;
            }

            // Fit Camera to Staged Curve Center
            if (is3D && camera instanceof THREE.PerspectiveCamera && controlsRef.current) {
                // Determine framing distance based on Rectangular Extents (approx diagonal)
                const dist = finalExtent * 1.5;

                controlsRef.current.target.copy(center);
                controlsRef.current.update();

                const vec = new THREE.Vector3(1, 0.8, 1.5).normalize().multiplyScalar(dist);
                camera.position.copy(center).add(vec);
                camera.lookAt(center);
                camera.updateProjectionMatrix();
            } else if (!is3D && camera instanceof THREE.OrthographicCamera) {
                // 2D Fit logic: Similar scaling
                camera.zoom = 500 / (finalExtent * 0.7);
                camera.position.set(0, 0, 10);
                camera.updateProjectionMatrix();
            }

            setFitReady(true);
        };

        raf = requestAnimationFrame(run);
        return () => cancelAnimationFrame(raf);
    }, [stagedData, finalExtent, center, is3D, camera, mode, size]);

    const planeVisibleScale = fitReady ? 1 : 0.0001;

    return (
        <>
            {is3D ? (
                <PerspectiveCamera makeDefault fov={45} />
            ) : (
                <OrthographicCamera makeDefault position={[0, 0, 10]} />
            )}

            {is3D && <OrbitControls ref={controlsRef} makeDefault enableDamping dampingFactor={0.1} />}

            <ambientLight intensity={0.7} />
            <pointLight position={[10, 10, 10]} intensity={0.8} />
            <pointLight position={[-10, 5, -5]} intensity={0.4} />

            <group>
                {(mode === 'curve' || mode === 'complex' || mode === 'auto') && <CurveRenderer data={stagedData} />}
                {(mode === 'surface') && <SurfaceRenderer data={stagedData} />}

                {showDiagramElements && is3D && (
                    <group>
                        {fitReady && (
                            <gridHelper position={[0, 0, 0]} args={[finalExtent, 10, 0x888888, 0xcccccc]} />
                        )}

                        <ProjectionPlane position={planes.xy.pos} size={planes.xy.size} rotation={[0, 0, 0]} color={themes.xy.hex} alpha={themes.xy.alpha} visibleScale={planeVisibleScale} />
                        <ProjectionPlane position={planes.xz.pos} size={planes.xz.size} rotation={[-Math.PI / 2, 0, 0]} color={themes.xz.hex} alpha={themes.xz.alpha} visibleScale={planeVisibleScale} />
                        <ProjectionPlane position={planes.yz.pos} size={planes.yz.size} rotation={[0, Math.PI / 2, 0]} color={themes.yz.hex} alpha={themes.yz.alpha} visibleScale={planeVisibleScale} />

                        {fitReady && mode !== 'surface' && (
                            <>
                                {/* Projections (Shadows) */}
                                <group position={[0, 0, 0]} scale={[1, 0, 1]}>
                                    <CurveRenderer data={stagedData} opacity={0.3} color={themes.xz.hex} />
                                </group>
                                <group position={[0, 0, 0]} scale={[1, 1, 0]}>
                                    <CurveRenderer data={stagedData} opacity={0.3} color={themes.xy.hex} />
                                </group>
                                <group position={[0, 0, 0]} scale={[0, 1, 1]}>
                                    <CurveRenderer data={stagedData} opacity={0.3} color={themes.yz.hex} />
                                </group>

                                {/* Dynamic Projections (Points & Lines) */}
                                <mesh ref={projXYRef} renderOrder={11}>
                                    <sphereGeometry args={[0.08, 16, 16]} />
                                    <meshBasicMaterial color={themes.xy.hex} depthTest={false} />
                                </mesh>
                                <mesh ref={projXZRef} renderOrder={11}>
                                    <sphereGeometry args={[0.08, 16, 16]} />
                                    <meshBasicMaterial color={themes.xz.hex} depthTest={false} />
                                </mesh>
                                <mesh ref={projYZRef} renderOrder={11}>
                                    <sphereGeometry args={[0.08, 16, 16]} />
                                    <meshBasicMaterial color={themes.yz.hex} depthTest={false} />
                                </mesh>

                                {/* Dashed Lines using Native THREE.LineSegments */}
                                <lineSegments ref={lineXYRef} renderOrder={12}>
                                    <bufferGeometry />
                                    <lineDashedMaterial color={themes.xy.hex} dashSize={0.2} gapSize={0.1} transparent opacity={0.9} depthTest={false} />
                                </lineSegments>
                                <lineSegments ref={lineXZRef} renderOrder={12}>
                                    <bufferGeometry />
                                    <lineDashedMaterial color={themes.xz.hex} dashSize={0.2} gapSize={0.1} transparent opacity={0.9} depthTest={false} />
                                </lineSegments>
                                <lineSegments ref={lineYZRef} renderOrder={12}>
                                    <bufferGeometry />
                                    <lineDashedMaterial color={themes.yz.hex} dashSize={0.2} gapSize={0.1} transparent opacity={0.9} depthTest={false} />
                                </lineSegments>
                            </>
                        )}

                        {fitReady && <axesHelper args={[finalExtent * 0.5]} position={[0, 0, 0]} />}
                    </group>
                )}

                {/* Main Cursor (Dynamic via Ref) */}
                <mesh ref={cursorMeshRef}>
                    <sphereGeometry args={[0.08, 32, 32]} />
                    <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.6} />
                </mesh>
            </group>

            {/* 2D View Helpers */}
            {!is3D && fitReady && (
                <>
                    {/* 2D Grid: Locked to Extent/Global Logic */}
                    <gridHelper args={[finalExtent, 10, 0x888888, 0x444444]} rotation={[Math.PI / 2, 0, 0]} />
                    <group
                        rotation={
                            type === 'xz' ? [-Math.PI / 2, 0, 0] :
                                type === 'yz' ? [0, -Math.PI / 2, 0] :
                                    [0, 0, 0]
                        }
                    >
                        <CurveRenderer data={stagedData} />
                        {/* We removed stagedCursor ref from useMemo, so we rely on cursorMeshRef even in 2D? 
                             Wait, 2D viewport is a separate Canvas. 
                             It has its own SceneContent. 
                             So it has its own cursorMeshRef. 
                             And useFrame runs there too.
                             So 2D cursor SHOULD work via useFrame just like 3D.
                             We don't need the static mesh here.
                         */}
                    </group>
                </>
            )}
        </>
    );
};

export const Viewport: React.FC<ViewportProps> = (props) => {
    const is3D = props.type === '3d';
    const themes = props.planeTheme || DEFAULT_THEME_FALLBACK;

    return (
        <div className={clsx("relative w-full h-full glass-panel overflow-hidden", props.className)} style={{ touchAction: 'none' }}>
            <div className="absolute top-2 left-2 z-10 text-xs font-bold text-[var(--text-muted)] uppercase pointer-events-none">
                {is3D ? (props.showDiagramElements ? 'Diagram View' : '3D View') : `${props.type.toUpperCase()} proj`}
            </div>

            <Canvas>
                <SceneContent {...props} themes={themes} />
            </Canvas>
        </div>
    );
};
