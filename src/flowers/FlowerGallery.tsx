"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import { useControls } from "leva";
import { CatmullRomCurve3, Vector3, type Group } from "three";
import { ALL_FLOWER_TYPES, defaultFlower, type FlowerType } from "./schema";
import { FlowerHead } from "./index";
import { createRisoStemMaterial } from "./risoMaterial";
import { headBounds } from "./generative";

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 0xffffffff;
}

function makeStemCurve(stemH: number, seed: number): CatmullRomCurve3 {
  const segments = 5;
  const sway = 0.06 + seed * 0.05;
  const phase = seed * Math.PI * 2;
  const points: Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const y = stemH * t;
    const x = Math.sin(t * Math.PI * 1.2 + phase) * sway * t;
    const z = Math.cos(t * Math.PI + phase * 1.7) * sway * 0.5 * t;
    points.push(new Vector3(x, y, z));
  }
  return new CatmullRomCurve3(points, false, "catmullrom", 0.5);
}

function SpinningFlower({ type }: { type: FlowerType }) {
  const flower = useMemo(() => defaultFlower(type), [type]);
  const ref = useRef<Group>(null);
  const stemH = flower.stemLength ?? 2.4;

  const { curve, headPos, stemRadius, material } = useMemo(() => {
    const seed = hashSeed(type);
    const c = makeStemCurve(stemH, seed);
    const top = c.getPoint(1);
    const radius = 0.009 + seed * 0.006;
    const greens = ["#4a7a3a", "#5e8c45", "#3d6b35", "#6b9856", "#557a40", "#42713a"];
    const stem = greens[Math.floor(seed * greens.length)];
    return {
      curve: c,
      headPos: top,
      stemRadius: radius,
      material: createRisoStemMaterial(stem),
    };
  }, [type, stemH]);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.6;
  });

  return (
    <group ref={ref} position={[0, -stemH * 0.35, 0]}>
      <mesh material={material}>
        <tubeGeometry args={[curve, 36, stemRadius, 10, false]} />
      </mesh>
      <group position={[headPos.x, headPos.y, headPos.z]}>
        <FlowerHead flower={flower} />
      </group>
    </group>
  );
}

function HeadSpheroid({ type }: { type: FlowerType }) {
  const flower = useMemo(() => defaultFlower(type), [type]);
  const stemH = flower.stemLength ?? 2.4;
  const seed = hashSeed(type);
  const c = useMemo(() => makeStemCurve(stemH, seed), [stemH, seed]);
  const top = useMemo(() => c.getPoint(1), [c]);
  const bounds = useMemo(() => headBounds(flower), [flower]);
  return (
    <group position={[top.x, top.y - stemH * 0.35, top.z]}>
      <mesh scale={[bounds.rx, bounds.ry, bounds.rz]}>
        <sphereGeometry args={[1, 16, 12]} />
        <meshBasicMaterial color="#3d7eff" wireframe transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

function FlowerTile({
  type,
  showSpheroid,
}: {
  type: FlowerType;
  showSpheroid: boolean;
}) {
  return (
    <div className="font-mono text-xs flex flex-col">
      <div className="aspect-square bg-cyan-50">
        <Canvas>
          <PerspectiveCamera makeDefault position={[0, 2.2, 3.4]} fov={32} />
          <ambientLight intensity={0.7} />
          <directionalLight position={[3, 4, 3]} intensity={1.0} />
          <SpinningFlower type={type} />
          {showSpheroid && <HeadSpheroid type={type} />}
        </Canvas>
      </div>
      <div className="px-1 py-1.5 truncate">{type}</div>
    </div>
  );
}

export default function FlowerGallery() {
  const types = ALL_FLOWER_TYPES;
  const { showSpheroid } = useControls({
    showSpheroid: { value: false, label: "show spheroid" },
  });
  return (
    <div className="p-6 font-mono">
      <h1 className="text-sm mb-4">flowers ({types.length})</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-1">
        {types.map((t) => (
          <FlowerTile key={t} type={t} showSpheroid={showSpheroid} />
        ))}
      </div>
    </div>
  );
}
