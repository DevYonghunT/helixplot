import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, OrthographicCamera, PerspectiveCamera, Html } from '@react-three/drei';
import clsx from 'clsx';
import * as THREE from 'three';
import type { SampleResult, Mode, RenderConfig } from '../core/types';
import type { PlaneTheme } from '../hooks/usePlaneTheme';
import { CurveRenderer, SurfaceRenderer } from './Renderers';
import { CanvasErrorBoundary } from './ErrorBoundary';
import { registerCaptureRenderer, unregisterCaptureRenderer } from '../utils/export';

import type { PlaybackRuntime } from '../hooks/usePlaybackRuntime';

/** Helper component to register Three.js renderer for screenshot capture */
const CaptureHelper: React.FC<{ isMain?: boolean }> = ({ isMain = false }) => {
    const { gl, scene, camera } = useThree();

    useEffect(() => {
        // Only register the main 3D viewport for capture
        if (isMain) {
            registerCaptureRenderer(gl, scene, camera);
        }
        return () => {
            if (isMain) {
                unregisterCaptureRenderer();
            }
        };
    }, [gl, scene, camera, isMain]);

    return null;
};

interface ViewportProps {
    data: SampleResult;
    mode: Mode;
    type: '3d' | 'x' | 'y' | 'z';
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
    z: { hex: "#3B82F6", alpha: 0.1 }, // XY -> Z Plane
    y: { hex: "#22C55E", alpha: 0.1 }, // XZ -> Y Plane
    x: { hex: "#EF4444", alpha: 0.1 }, // YZ -> X Plane
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

// Axis labels rendered as Html overlays at axis endpoints
const AxisLabels: React.FC<{ extent: number }> = ({ extent }) => {
    const half = extent * 0.55;
    const style: React.CSSProperties = {
        fontSize: 11,
        fontWeight: 700,
        fontFamily: 'system-ui, sans-serif',
        pointerEvents: 'none',
        userSelect: 'none',
        textShadow: '0 1px 3px rgba(0,0,0,0.4)',
        letterSpacing: 0.5,
    };
    return (
        <>
            <Html position={[half, 0, 0]} center distanceFactor={extent * 1.2} zIndexRange={[1, 0]}>
                <span style={{ ...style, color: '#ef4444' }}>X</span>
            </Html>
            <Html position={[0, half, 0]} center distanceFactor={extent * 1.2} zIndexRange={[1, 0]}>
                <span style={{ ...style, color: '#22c55e' }}>Y</span>
            </Html>
            <Html position={[0, 0, half]} center distanceFactor={extent * 1.2} zIndexRange={[1, 0]}>
                <span style={{ ...style, color: '#3b82f6' }}>Z</span>
            </Html>
        </>
    );
};

// Tick marks along each axis
const AxisTicks: React.FC<{ extent: number }> = ({ extent }) => {
    const half = extent * 0.5;
    const step = extent >= 20 ? 5 : extent >= 6 ? 2 : 1;
    const ticks: { pos: [number, number, number]; label: string }[] = [];

    for (let v = step; v <= half; v += step) {
        ticks.push({ pos: [v, 0, 0], label: v.toFixed(v % 1 === 0 ? 0 : 1) });
        ticks.push({ pos: [-v, 0, 0], label: (-v).toFixed(v % 1 === 0 ? 0 : 1) });
        ticks.push({ pos: [0, v, 0], label: v.toFixed(v % 1 === 0 ? 0 : 1) });
        ticks.push({ pos: [0, -v, 0], label: (-v).toFixed(v % 1 === 0 ? 0 : 1) });
    }

    const style: React.CSSProperties = {
        fontSize: 9,
        color: 'var(--muted, rgba(150,150,150,0.7))',
        fontFamily: 'system-ui, monospace',
        pointerEvents: 'none',
        userSelect: 'none',
    };

    return (
        <>
            {ticks.map((t, i) => (
                <Html key={i} position={t.pos} center distanceFactor={extent * 1.5} zIndexRange={[1, 0]}>
                    <span style={style}>{t.label}</span>
                </Html>
            ))}
        </>
    );
};

// Inner Component to handle Scene Logic with useThree
const SceneContent = ({
    data, mode, type, showDiagramElements = false, themes, playbackRt, config, driveClock
}: ViewportProps & { themes: any }) => {
    const { camera, size, invalidate } = useThree();

    // Invalidate on data/config change
    useEffect(() => {
        invalidate();
    }, [data, config, mode, themes, size, invalidate]);

    const controlsRef = useRef<any>(null);

    const [fitReady, setFitReady] = useState(false);
    const [cursorCoords, setCursorCoords] = useState<{ x: number; y: number; z: number } | null>(null);
    const is3D = type === '3d';

    // Keep orbit controls responsive even while playback is running
    useFrame(() => {
        if (controlsRef.current) controlsRef.current.update();
    });

    // Refs for Dynamic Updates (Animation)
    const cursorMeshRef = useRef<THREE.Mesh>(null);
    const projZRef = useRef<THREE.Mesh>(null); // XY -> Z
    const projYRef = useRef<THREE.Mesh>(null); // XZ -> Y
    const projXRef = useRef<THREE.Mesh>(null); // YZ -> X
    const lineZRef = useRef<THREE.LineSegments>(null);
    const lineYRef = useRef<THREE.LineSegments>(null);
    const lineXRef = useRef<THREE.LineSegments>(null);

    // Reusable Vector3 instances to avoid GC pressure in useFrame
    const tempVec1 = useRef(new THREE.Vector3());
    const tempVec2 = useRef(new THREE.Vector3());

    // Symmetric Box Logic
    const { stagedData, finalExtent, center, planes, anchor } = React.useMemo(() => {
        // Default returns for empty data
        if (!data.points || data.points.length < 2) {
            return {
                stagedData: data,
                finalExtent: 10,
                center: new THREE.Vector3(0, 0, 0),
                planes: {
                    z: { pos: [0, 0, -5] as [number, number, number], size: [10, 10] as [number, number] },
                    y: { pos: [0, -5, 0] as [number, number, number], size: [10, 10] as [number, number] },
                    x: { pos: [-5, 0, 0] as [number, number, number], size: [10, 10] as [number, number] }
                },
                anchor: new THREE.Vector3(-5, -5, -5)
            };
        }

        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        let minZ = Infinity, maxZ = -Infinity;

        for (const p of data.points) {
            if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
            if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y;
            if (p.z < minZ) minZ = p.z; if (p.z > maxZ) maxZ = p.z;
        }

        // Global Symmetric Extent
        const absMaxX = Math.max(Math.abs(minX), Math.abs(maxX));
        const absMaxY = Math.max(Math.abs(minY), Math.abs(maxY));
        const absMaxZ = Math.max(Math.abs(minZ), Math.abs(maxZ));

        const halfSize = Math.max(absMaxX, absMaxY, absMaxZ) * 1.15; // 15% Padding
        const planeSize = halfSize * 2;

        // Planes are positioned at NEGATIVE extent (behind the data)
        const anchorVal = -halfSize;

        // Center is 0,0,0 because our box is symmetric
        const c = new THREE.Vector3(0, 0, 0);

        return {
            stagedData: data,
            finalExtent: planeSize,
            center: c,
            planes: {
                // Z Plane (XY Projection) sits at z = -halfSize
                z: {
                    pos: [0, 0, anchorVal] as [number, number, number],
                    size: [planeSize, planeSize] as [number, number]
                },
                // Y Plane (XZ Projection) sits at y = -halfSize
                y: {
                    pos: [0, anchorVal, 0] as [number, number, number],
                    size: [planeSize, planeSize] as [number, number]
                },
                // X Plane (YZ Projection) sits at x = -halfSize
                x: {
                    pos: [anchorVal, 0, 0] as [number, number, number],
                    size: [planeSize, planeSize] as [number, number]
                }
            },
            anchor: new THREE.Vector3(anchorVal, anchorVal, anchorVal)
        };
    }, [data.revision, data.points]);

    const coordThrottleRef = useRef(0);

    // High-Frequency Loop via Playback Runtime
    useFrame((_state, delta) => {
        if (!playbackRt || !config || !stagedData.points || stagedData.points.length < 2) return;

        if (driveClock) {
            playbackRt.step(delta, config.tRange[0], config.tRange[1]);
        }

        const t = playbackRt.tRef.current;
        const [tMin, tMax] = config.tRange;
        const duration = tMax - tMin || 1;
        const u = Math.max(0, Math.min(1, (t - tMin) / duration));

        const idx = u * (stagedData.points.length - 1);
        const i = Math.floor(idx);
        const f = idx - i;
        const p1 = stagedData.points[i];
        const p2 = stagedData.points[Math.min(i + 1, stagedData.points.length - 1)];

        if (p1 && p2) {
            const px = p1.x + (p2.x - p1.x) * f;
            const py = p1.y + (p2.y - p1.y) * f;
            const pz = p1.z + (p2.z - p1.z) * f;

            const ax = anchor.x;
            const ay = anchor.y;
            const az = anchor.z;

            if (cursorMeshRef.current) {
                cursorMeshRef.current.position.set(px, py, pz);
                cursorMeshRef.current.visible = true;
                // Update coordinate display (throttled: ~5 updates/sec)
                coordThrottleRef.current += delta;
                if (coordThrottleRef.current > 0.2) {
                    coordThrottleRef.current = 0;
                    setCursorCoords({ x: px, y: py, z: pz });
                }
            }

            if (showDiagramElements && fitReady && is3D) {
                // Reuse temp vectors to avoid GC pressure
                const v1 = tempVec1.current;
                const v2 = tempVec2.current;

                // Z Projection (XY)
                if (projZRef.current) projZRef.current.position.set(px, py, az);
                if (lineZRef.current) {
                    lineZRef.current.geometry.setFromPoints([
                        v1.set(px, py, pz),
                        v2.set(px, py, az)
                    ]);
                    lineZRef.current.computeLineDistances();
                    lineZRef.current.visible = true;
                }

                // Y Projection (XZ)
                if (projYRef.current) projYRef.current.position.set(px, ay, pz);
                if (lineYRef.current) {
                    lineYRef.current.geometry.setFromPoints([
                        v1.set(px, py, pz),
                        v2.set(px, ay, pz)
                    ]);
                    lineYRef.current.computeLineDistances();
                    lineYRef.current.visible = true;
                }

                // X Projection (YZ)
                if (projXRef.current) projXRef.current.position.set(ax, py, pz);
                if (lineXRef.current) {
                    lineXRef.current.geometry.setFromPoints([
                        v1.set(px, py, pz),
                        v2.set(ax, py, pz)
                    ]);
                    lineXRef.current.computeLineDistances();
                    lineXRef.current.visible = true;
                }
            }
        }
    });

    // Robust Fit Loop
    useEffect(() => {
        let raf = 0;
        const run = () => {
            if (!stagedData.points || stagedData.points.length < 2 || size.width === 0 || size.height === 0) {
                raf = requestAnimationFrame(run);
                return;
            }

            if (is3D && camera instanceof THREE.PerspectiveCamera && controlsRef.current) {
                const dist = finalExtent * 1.5;
                controlsRef.current.target.copy(center);
                controlsRef.current.update();
                const vec = new THREE.Vector3(1, 0.8, 1.5).normalize().multiplyScalar(dist);
                camera.position.copy(center).add(vec);
                camera.lookAt(center);
                camera.updateProjectionMatrix();
            } else if (!is3D && camera instanceof THREE.OrthographicCamera) {
                camera.zoom = 500 / (finalExtent * 0.7);
                // Position and up vector depends on type (x/y/z)
                if (type === 'z') {
                    // Z plane (XY): Look from +Z axis
                    camera.position.set(0, 0, finalExtent);
                    camera.up.set(0, 1, 0);
                } else if (type === 'y') {
                    // Y plane (XZ): Look from +Y axis (top-down view)
                    camera.position.set(0, finalExtent, 0);
                    camera.up.set(0, 0, -1); // Up points to -Z so X goes right, Z goes up
                } else if (type === 'x') {
                    // X plane (YZ): Look from +X axis
                    camera.position.set(finalExtent, 0, 0);
                    camera.up.set(0, 1, 0);
                }

                camera.lookAt(0, 0, 0);
                camera.updateProjectionMatrix();
            }

            setFitReady(true);
        };

        raf = requestAnimationFrame(run);
        return () => cancelAnimationFrame(raf);
    }, [stagedData, finalExtent, center, is3D, camera, mode, size, type]);

    const planeVisibleScale = fitReady ? 1 : 0.0001;
    // Map nice theme keys
    // Z Plane corresponds to XY Projection (user sees XY)
    const themeZ = themes.z || themes.xy || DEFAULT_THEME_FALLBACK.z;
    // Y Plane corresponds to XZ Projection (user sees XZ)
    const themeY = themes.y || themes.xz || DEFAULT_THEME_FALLBACK.y;
    // X Plane corresponds to YZ Projection (user sees YZ)
    const themeX = themes.x || themes.yz || DEFAULT_THEME_FALLBACK.x;

    // Determine visibility based on Viewport Type
    // 3D: Show all (if enabled)
    // Z (XY View): Show Z Plane only
    // Y (XZ View): Show Y Plane only
    // X (YZ View): Show X Plane only
    const showZ = is3D || type === 'z';
    const showY = is3D || type === 'y';
    const showX = is3D || type === 'x';

    return (
        <>
            {/* Register renderer for screenshot capture (only main 3D view) */}
            <CaptureHelper isMain={is3D} />

            {is3D ? (
                <PerspectiveCamera makeDefault fov={45} />
            ) : (
                <OrthographicCamera
                    makeDefault
                    position={
                        type === 'z' ? [0, 0, 10] :
                        type === 'y' ? [0, 10, 0] :
                        [10, 0, 0]
                    }
                    up={
                        type === 'y' ? [0, 0, -1] : [0, 1, 0]
                    }
                    zoom={20}
                />
            )}

            <OrbitControls
                ref={controlsRef}
                makeDefault
                enableDamping
                dampingFactor={0.08}
                enableZoom
                enablePan
                enableRotate={is3D}
                screenSpacePanning={!is3D}
                touches={{
                    ONE: is3D ? THREE.TOUCH.ROTATE : THREE.TOUCH.PAN,
                    TWO: THREE.TOUCH.DOLLY_PAN
                }}
            />

            <ambientLight intensity={0.7} />
            <pointLight position={[10, 10, 10]} intensity={0.8} />
            <pointLight position={[-10, 5, -5]} intensity={0.4} />

            <group>
                {(mode === 'curve' || mode === 'complex' || mode === 'auto') && <CurveRenderer data={stagedData} />}
                {(mode === 'surface') && <SurfaceRenderer data={stagedData} />}

                {showDiagramElements && (
                    <group>
                        {fitReady && is3D && (
                            <gridHelper position={[0, -finalExtent / 2, 0]} args={[finalExtent, 10, 0x888888, 0xcccccc]} />
                        )}

                        {/* Z Plane (XY) */}
                        {showZ && <ProjectionPlane position={planes.z.pos} size={planes.z.size} rotation={[0, 0, 0]} color={themeZ.hex} alpha={themeZ.alpha} visibleScale={planeVisibleScale} />}
                        {/* Y Plane (XZ) */}
                        {showY && <ProjectionPlane position={planes.y.pos} size={planes.y.size} rotation={[-Math.PI / 2, 0, 0]} color={themeY.hex} alpha={themeY.alpha} visibleScale={planeVisibleScale} />}
                        {/* X Plane (YZ) */}
                        {showX && <ProjectionPlane position={planes.x.pos} size={planes.x.size} rotation={[0, Math.PI / 2, 0]} color={themeX.hex} alpha={themeX.alpha} visibleScale={planeVisibleScale} />}

                        {fitReady && mode !== 'surface' && (
                            <>
                                {/* Projections (Shadows) */}
                                {showY && (
                                    <group position={[0, anchor.y, 0]} scale={[1, 0, 1]}>
                                        <CurveRenderer data={stagedData} opacity={0.3} color={themeY.hex} />
                                    </group>
                                )}
                                {showZ && (
                                    <group position={[0, 0, anchor.z]} scale={[1, 1, 0]}>
                                        <CurveRenderer data={stagedData} opacity={0.3} color={themeZ.hex} />
                                    </group>
                                )}
                                {showX && (
                                    <group position={[anchor.x, 0, 0]} scale={[0, 1, 1]}>
                                        <CurveRenderer data={stagedData} opacity={0.3} color={themeX.hex} />
                                    </group>
                                )}

                                {/* Dynamic Projections */}
                                <mesh ref={projZRef} renderOrder={11} visible={showZ}>
                                    <sphereGeometry args={[0.08, 16, 16]} />
                                    <meshBasicMaterial color={themeZ.hex} depthTest={false} />
                                </mesh>
                                <mesh ref={projYRef} renderOrder={11} visible={showY}>
                                    <sphereGeometry args={[0.08, 16, 16]} />
                                    <meshBasicMaterial color={themeY.hex} depthTest={false} />
                                </mesh>
                                <mesh ref={projXRef} renderOrder={11} visible={showX}>
                                    <sphereGeometry args={[0.08, 16, 16]} />
                                    <meshBasicMaterial color={themeX.hex} depthTest={false} />
                                </mesh>

                                <lineSegments ref={lineZRef} renderOrder={12} visible={showZ}>
                                    <bufferGeometry />
                                    <lineDashedMaterial color={themeZ.hex} dashSize={0.2} gapSize={0.1} transparent opacity={0.9} depthTest={false} />
                                </lineSegments>
                                <lineSegments ref={lineYRef} renderOrder={12} visible={showY}>
                                    <bufferGeometry />
                                    <lineDashedMaterial color={themeY.hex} dashSize={0.2} gapSize={0.1} transparent opacity={0.9} depthTest={false} />
                                </lineSegments>
                                <lineSegments ref={lineXRef} renderOrder={12} visible={showX}>
                                    <bufferGeometry />
                                    <lineDashedMaterial color={themeX.hex} dashSize={0.2} gapSize={0.1} transparent opacity={0.9} depthTest={false} />
                                </lineSegments>
                            </>
                        )}
                        {fitReady && <axesHelper args={[finalExtent * 0.5]} position={[0, 0, 0]} />}
                        {fitReady && is3D && <AxisLabels extent={finalExtent} />}
                        {fitReady && is3D && <AxisTicks extent={finalExtent} />}
                    </group>
                )}

                <mesh ref={cursorMeshRef}>
                    <sphereGeometry args={[0.08, 32, 32]} />
                    <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.6} />
                </mesh>

                {/* Coordinate tooltip attached to cursor */}
                {cursorCoords && cursorMeshRef.current && (
                    <Html
                        position={[cursorCoords.x, cursorCoords.y + 0.3, cursorCoords.z]}
                        center
                        distanceFactor={finalExtent * 1.2}
                        zIndexRange={[1, 0]}
                        style={{ pointerEvents: 'none' }}
                    >
                        <div style={{
                            background: 'rgba(0,0,0,0.75)',
                            color: '#fff',
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontSize: 10,
                            fontFamily: 'monospace',
                            whiteSpace: 'nowrap',
                            backdropFilter: 'blur(4px)',
                        }}>
                            ({cursorCoords.x.toFixed(2)}, {cursorCoords.y.toFixed(2)}, {cursorCoords.z.toFixed(2)})
                        </div>
                    </Html>
                )}
            </group>
        </>
    );
};

// Inner helper to reset OrbitControls from Canvas child
const ResetViewOnDoubleClick: React.FC = () => {
    const { camera, gl, invalidate } = useThree();
    useEffect(() => {
        const handler = () => {
            if (camera instanceof THREE.PerspectiveCamera) {
                camera.position.set(8, 6, 12);
                camera.lookAt(0, 0, 0);
                camera.updateProjectionMatrix();
            } else if (camera instanceof THREE.OrthographicCamera) {
                camera.zoom = 20;
                camera.updateProjectionMatrix();
            }
            invalidate();
        };
        gl.domElement.addEventListener('dblclick', handler);
        return () => gl.domElement.removeEventListener('dblclick', handler);
    }, [camera, gl, invalidate]);
    return null;
};

export const Viewport: React.FC<ViewportProps> = (props) => {
    const is3D = props.type === '3d';
    const themes = props.planeTheme || DEFAULT_THEME_FALLBACK;

    let bgLabel = "";
    if (is3D) bgLabel = props.showDiagramElements ? 'Diagram View' : '3D View';
    else if (props.type === 'x') bgLabel = 'X Plane (YZ)';
    else if (props.type === 'y') bgLabel = 'Y Plane (XZ)';
    else if (props.type === 'z') bgLabel = 'Z Plane (XY)';

    return (
        <div className={clsx("relative w-full h-full glass-panel overflow-hidden", props.className)} style={{ touchAction: 'none' }}>
            <div className="absolute top-2 left-2 z-10 text-xs font-bold text-[var(--text-muted)] uppercase pointer-events-none">
                {bgLabel}
            </div>

            <CanvasErrorBoundary>
                <Canvas
                    key={`plane-${props.type}`}
                    style={{ touchAction: 'none' }}
                    frameloop={props.playbackRt?.isPlaying ? 'always' : 'demand'}
                    gl={{ preserveDrawingBuffer: true }}
                >
                    <SceneContent {...props} themes={themes} />
                    <ResetViewOnDoubleClick />
                </Canvas>
            </CanvasErrorBoundary>
        </div>
    );
};
