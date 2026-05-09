"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import { type Group } from "three";
import { useControls, folder } from "leva";
import {
  DoubleSide,
  PETAL_PRESETS,
  petalGeometry,
  type PetalShape,
  type PetalPresetKey,
} from "./generative";

function SpinningPetal({ shape, color }: { shape: PetalShape; color: string }) {
  const ref = useRef<Group>(null);
  const geometry = useMemo(() => petalGeometry(shape), [shape]);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.6;
  });
  return (
    <group ref={ref} position={[0, -0.3, 0]}>
      <mesh geometry={geometry}>
        <meshStandardMaterial color={color} roughness={0.55} side={DoubleSide} />
      </mesh>
    </group>
  );
}

function PetalTile({ shape, label, color = "#ff7a90" }: { shape: PetalShape; label: string; color?: string }) {
  return (
    <div className="font-mono text-xs flex flex-col">
      <div className="aspect-square bg-cyan-50">
        <Canvas>
          <PerspectiveCamera makeDefault position={[0, 0, 1.6]} fov={35} />
          <ambientLight intensity={0.7} />
          <directionalLight position={[3, 4, 3]} intensity={1.0} />
          <SpinningPetal shape={shape} color={color} />
        </Canvas>
      </div>
      <div className="px-1 py-1.5 truncate">{label}</div>
    </div>
  );
}

export default function PetalGallery() {
  const live = useControls({
    color: "#ff7a90",
    shape: folder({
      length: { value: 0.6, min: 0.1, max: 1.2, step: 0.01 },
      maxWidth: { value: 0.22, min: 0.02, max: 0.5, step: 0.01 },
      baseWidth: { value: 0.04, min: 0.01, max: 0.2, step: 0.005 },
      tipSharpness: { value: 0.35, min: 0, max: 1, step: 0.01 },
      segments: { value: 22, min: 6, max: 40, step: 1 },
    }),
    bend: folder({
      bend: { value: 0.5, min: 0, max: 1.2, step: 0.01 },
      curl: { value: 0.4, min: 0, max: 1.5, step: 0.01 },
      cup: { value: 0.3, min: 0, max: 1, step: 0.01 },
      twist: { value: 0, min: -1, max: 1, step: 0.01 },
      sideSway: { value: 0, min: -1, max: 1, step: 0.01 },
    }),
    surface: folder({
      ruffle: { value: 0, min: 0, max: 2, step: 0.05 },
      edgeWave: { value: 0, min: 0, max: 2, step: 0.05 },
      noiseAmp: { value: 0, min: 0, max: 2, step: 0.05 },
      noiseSeed: { value: 0, min: 0, max: 100, step: 1 },
    }),
  });

  const liveShape: PetalShape = useMemo(
    () => ({
      length: live.length,
      maxWidth: live.maxWidth,
      baseWidth: live.baseWidth,
      tipSharpness: live.tipSharpness,
      segments: live.segments,
      bend: live.bend,
      curl: live.curl,
      cup: live.cup,
      twist: live.twist,
      sideSway: live.sideSway,
      ruffle: live.ruffle,
      edgeWave: live.edgeWave,
      noiseAmp: live.noiseAmp,
      noiseSeed: live.noiseSeed,
    }),
    [
      live.length, live.maxWidth, live.baseWidth, live.tipSharpness, live.segments,
      live.bend, live.curl, live.cup, live.twist, live.sideSway,
      live.ruffle, live.edgeWave, live.noiseAmp, live.noiseSeed,
    ],
  );

  const keys = Object.keys(PETAL_PRESETS) as PetalPresetKey[];

  return (
    <div className="p-6 font-mono">
      <h1 className="text-sm mb-4">petals ({keys.length} presets + 1 live)</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-1">
        <div className="ring-2 ring-cyan-500 rounded-sm">
          <PetalTile shape={liveShape} label="live" color={live.color} />
        </div>
        {keys.map((k) => (
          <PetalTile key={k} shape={PETAL_PRESETS[k]} label={k} />
        ))}
      </div>
    </div>
  );
}
