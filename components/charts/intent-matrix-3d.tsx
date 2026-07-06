"use client";

import { useMemo, useRef, useState } from "react";
import { Canvas, type ThreeEvent } from "@react-three/fiber";
import { Edges, Line, OrbitControls, Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";
import {
  type IntentMatrixPoint,
  riskColorHex,
  spreadIntentPoints,
} from "@/lib/intent-matrix-points";

function AxisLines() {
  return (
    <group>
      <Line points={[[0, 0, 0], [1.05, 0, 0]]} color="#22d3ee" lineWidth={2} />
      <Line points={[[0, 0, 0], [0, 1.05, 0]]} color="#fbbf24" lineWidth={2} />
      <Line points={[[0, 0, 0], [0, 0, 1.05]]} color="#fb7185" lineWidth={2} />
      <mesh position={[0.5, 0.5, 0.5]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial visible={false} />
        <Edges color="#334155" threshold={15} />
      </mesh>
    </group>
  );
}

function PointCloud({
  points,
  onSelect,
}: {
  points: IntentMatrixPoint[];
  onSelect: (p: IntentMatrixPoint | null) => void;
}) {
  const ref = useRef<THREE.Points>(null);
  const { positions, colors, lookup } = useMemo(() => {
    const positions = new Float32Array(points.length * 3);
    const colors = new Float32Array(points.length * 3);
    const lookup: IntentMatrixPoint[] = points;
    points.forEach((p, i) => {
      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;
      const c = new THREE.Color(riskColorHex(p.riskLevel));
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    });
    return { positions, colors, lookup };
  }, [points]);

  function handleClick(e: ThreeEvent<MouseEvent>) {
    e.stopPropagation();
    const idx = e.index;
    if (idx != null && lookup[idx]) {
      onSelect(lookup[idx]!);
    }
  }

  return (
    <Points
      ref={ref}
      positions={positions}
      colors={colors}
      stride={3}
      frustumCulled={false}
      onClick={handleClick}
    >
      <PointMaterial
        vertexColors
        transparent
        opacity={0.82}
        size={0.018}
        sizeAttenuation
        depthWrite={false}
      />
    </Points>
  );
}

function Scene({
  points,
  onSelect,
}: {
  points: IntentMatrixPoint[];
  onSelect: (p: IntentMatrixPoint | null) => void;
}) {
  return (
    <>
      <ambientLight intensity={0.65} />
      <directionalLight position={[2, 3, 4]} intensity={0.85} />
      <AxisLines />
      <PointCloud points={points} onSelect={onSelect} />
      <OrbitControls
        makeDefault
        target={[0.5, 0.5, 0.5]}
        minDistance={0.6}
        maxDistance={4}
        enablePan
      />
    </>
  );
}

export function IntentMatrixScatter3D({ data }: { data: IntentMatrixPoint[] }) {
  const spread = useMemo(() => spreadIntentPoints(data), [data]);
  const [selected, setSelected] = useState<IntentMatrixPoint | null>(null);
  const [webglError, setWebglError] = useState(false);

  if (webglError) {
    return (
      <div className="flex h-[560px] items-center justify-center rounded-xl border border-surface-border bg-surface-subtle/40 p-6 text-center text-sm text-ink-muted">
        3D view could not initialize. Switch to the 2D projection tab above.
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="h-[560px] overflow-hidden rounded-xl border border-surface-border bg-[#0a0f18]">
        <Canvas
          camera={{ position: [1.6, 1.4, 1.8], fov: 50, near: 0.01, far: 100 }}
          onPointerMissed={() => setSelected(null)}
          onCreated={({ gl }) => {
            gl.domElement.addEventListener("webglcontextlost", () => setWebglError(true), {
              once: true,
            });
          }}
          gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        >
          <color attach="background" args={["#0a0f18"]} />
          <Scene points={spread} onSelect={setSelected} />
        </Canvas>
      </div>

      {selected && (
        <div className="absolute bottom-3 left-3 right-3 max-w-sm rounded-lg border border-surface-border bg-surface-raised/95 p-3 text-xs shadow-xl backdrop-blur">
          <p className="font-semibold text-ink">{selected.intentLabel}</p>
          <p className="mt-1 text-ink-muted">{selected.messageSnippet}</p>
          <p className="mt-2 font-mono text-[10px] text-ink-dim">
            x={selected.x.toFixed(3)} · y={selected.y.toFixed(3)} · z={selected.z.toFixed(3)}
          </p>
          <p className="capitalize text-ink-dim">
            {selected.riskLevel} risk · {selected.actionStatus.replace(/_/g, " ")}
            {selected.toolName ? ` · ${selected.toolName}` : ""}
          </p>
          <p className="mt-1 text-[10px] text-ink-dim">
            {new Date(selected.timestamp).toLocaleString()}
          </p>
        </div>
      )}

      <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-ink-dim">
        <span className="flex items-center gap-1">
          <span className="inline-block size-2 rounded-full bg-accent-cyan" /> x — Human Agency
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block size-2 rounded-full bg-accent-amber" /> y — Risk
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block size-2 rounded-full bg-accent-rose" /> z — Urgency
        </span>
        <span>Color: low → critical (green → red)</span>
      </div>
    </div>
  );
}
