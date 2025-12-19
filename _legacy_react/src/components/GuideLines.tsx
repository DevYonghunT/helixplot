
import * as THREE from "three";
import { Line } from "@react-three/drei";

type Vec3 = THREE.Vector3 | [number, number, number];

function toArr(v: Vec3): [number, number, number] {
    return Array.isArray(v) ? v : [v.x, v.y, v.z];
}

export function GuideLines({
    from,
    targets,
    color = "#111827",
    opacity = 0.25,
    dashSize = 0.12,
    gapSize = 0.08,
}: {
    from: Vec3;
    targets: Vec3[];
    color?: string;
    opacity?: number;
    dashSize?: number;
    gapSize?: number;
}) {
    const f = toArr(from);

    return (
        <group>
            {targets.map((t, i) => (
                <Line
                    key={i}
                    points={[f, toArr(t)]}
                    color={color}
                    transparent
                    opacity={opacity}
                    dashed
                    dashSize={dashSize}
                    gapSize={gapSize}
                />
            ))}
        </group>
    );
}
