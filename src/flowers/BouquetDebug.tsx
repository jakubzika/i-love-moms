"use client";

import { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { useControls, folder } from "leva";
import { PostFx, POSTFX_OPTIONS, type PostFxPreset, type RisoConfig } from "./postprocessing";
import { Color, Quaternion, Vector3 } from "three";
import {
  buildStemLeaves,
  hashSeed,
  makeBendableStemCurve,
  mulberry32,
  packBouquet,
  sizeScale,
  type Placement,
} from "./generative";
import { ALL_FLOWER_TYPES, type FlowerType } from "./schema";
import { defaultFlower, type Flower } from "./flower";
import { FlowerHead } from "./index";
import { createRisoStemMaterial } from "./risoMaterial";

function StemCurve({
  base,
  head,
  seed,
  showGuide,
}: {
  base: Vector3;
  head: Vector3;
  seed: number;
  showGuide: boolean;
}) {
  const { curve, radius, material, leaves } = useMemo(() => {
    const c = makeBendableStemCurve(base, head, seed);
    const rand = mulberry32(seed);
    const r = 0.011 + rand() * 0.007;
    const greens = ["#a8c98a", "#bdd89e", "#94b97a", "#c0d6a8", "#a3c97a", "#9bbf7e"];
    const stem = greens[Math.floor(rand() * greens.length)];
    return {
      curve: c,
      radius: r,
      material: createRisoStemMaterial(stem),
      leaves: buildStemLeaves(c, seed),
    };
  }, [base, head, seed]);

  return (
    <group>
      <mesh material={material}>
        <tubeGeometry args={[curve, 32, radius, 8, false]} />
      </mesh>
      {leaves.map((l) => (
        <mesh
          key={l.key}
          geometry={l.geometry}
          position={l.position}
          quaternion={l.quaternion}
          material={material}
        />
      ))}
      {showGuide && (
        <>
          <mesh position={[base.x, base.y, base.z]}>
            <sphereGeometry args={[0.04, 12, 12]} />
            <meshStandardMaterial color="#ff5e7a" />
          </mesh>
          <mesh position={[head.x, head.y, head.z]}>
            <sphereGeometry args={[0.04, 12, 12]} />
            <meshStandardMaterial color="#3d7eff" />
          </mesh>
        </>
      )}
    </group>
  );
}

function HeadEllipsoid({ p }: { p: Placement }) {
  const q = useMemo(() => {
    const up = new Vector3(0, 1, 0);
    return new Quaternion().setFromUnitVectors(up, p.normal.clone().normalize());
  }, [p.normal]);
  return (
    <group position={[p.head.x, p.head.y, p.head.z]} quaternion={q}>
      <mesh>
        <sphereGeometry args={[1, 16, 12]} />
        <meshStandardMaterial
          color="#ff7a90"
          transparent
          opacity={0.18}
          depthWrite={false}
          wireframe
        />
      </mesh>
      <group scale={[p.bounds.rx, p.bounds.ry, p.bounds.rz]}>
        <mesh>
          <sphereGeometry args={[1, 16, 12]} />
          <meshStandardMaterial
            color="#3d7eff"
            transparent
            opacity={0.12}
            depthWrite={false}
          />
        </mesh>
      </group>
    </group>
  );
}

function PlacedFlower({ p, seed, showHead, showEllipsoid, showGuide }: {
  p: Placement;
  seed: number;
  showHead: boolean;
  showEllipsoid: boolean;
  showGuide: boolean;
}) {
  const q = useMemo(() => {
    const up = new Vector3(0, 1, 0);
    return new Quaternion().setFromUnitVectors(up, p.normal.clone().normalize());
  }, [p.normal]);
  return (
    <group>
      <StemCurve base={p.base} head={p.head} seed={seed} showGuide={showGuide} />
      {showHead && (
        <group position={[p.head.x, p.head.y, p.head.z]} quaternion={q}>
          <FlowerHead flower={p.flower} />
        </group>
      )}
      {showEllipsoid && <HeadEllipsoid p={p} />}
    </group>
  );
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const c = new Color(hex);
  const out = { h: 0, s: 0, l: 0 };
  c.getHSL(out);
  return out;
}

function pickInkForHueRange(
  hexes: string[],
  hueCenter: number,
  hueWidth: number,
  fallback: string,
): string {
  const candidates = hexes
    .map((hex) => ({ hex, hsl: hexToHsl(hex) }))
    .filter((c) => {
      const d = Math.min(
        Math.abs(c.hsl.h - hueCenter),
        1 - Math.abs(c.hsl.h - hueCenter),
      );
      return d <= hueWidth && c.hsl.s > 0.15;
    });
  if (candidates.length === 0) return fallback;
  candidates.sort((a, b) => b.hsl.s + b.hsl.l - (a.hsl.s + a.hsl.l));
  const best = candidates[0];
  const c = new Color();
  c.setHSL(best.hsl.h, Math.min(1, best.hsl.s * 1.15), Math.min(0.6, best.hsl.l * 0.95));
  return `#${c.getHexString()}`;
}

function deriveInks(flowers: Flower[]): { inkA: string; inkB: string; inkC: string } {
  const colors = flowers.map((f) => f.color);
  return {
    // pink/red layer: hue ~0 (red) to ~0.05 (pink)
    inkA: pickInkForHueRange(colors, 0.0, 0.12, "#ff2d5a"),
    // blue layer: hue ~0.55–0.7
    inkB: pickInkForHueRange(colors, 0.62, 0.15, "#0050ff"),
    // yellow/warm layer: hue ~0.13 (yellow)
    inkC: pickInkForHueRange(colors, 0.13, 0.1, "#ffd23a"),
  };
}

export default function BouquetDebug() {
  const controls = useControls({
    composition: folder({
      preset: {
        value: "mixed" as "mixed" | "roses" | "tulips" | "wild",
        options: ["mixed", "roses", "tulips", "wild"],
      },
      flowerCount: { value: 14, min: 3, max: 60, step: 1 },
      seed: { value: 1, min: 0, max: 200, step: 1 },
    }),
    packing: folder({
      baseY: { value: 1.6, min: 0.4, max: 3, step: 0.05 },
      pad: { value: 0.08, min: 0, max: 0.3, step: 0.005 },
      domeRScale: { value: 1.1, min: 0.6, max: 2, step: 0.05 },
      domeHScale: { value: 0.55, min: 0.2, max: 1.2, step: 0.05 },
      headBoundsScale: { value: 1, min: 0.3, max: 2.5, step: 0.05, label: "head bounds" },
    }),
    show: folder({
      showHeads: true,
      showEllipsoids: true,
      showStemGuides: false,
      showDome: true,
    }),
    postfx: folder({
      effect: {
        value: "off" as PostFxPreset,
        options: POSTFX_OPTIONS as readonly string[],
      },
      matchFlowers: { value: true, label: "match flowers" },
      inkA: { value: "#ff2d5a", label: "ink A (pink)" },
      inkB: { value: "#0050ff", label: "ink B (blue)" },
      inkC: { value: "#ffd23a", label: "ink C (yellow)" },
      paper: "#fff8e7",
      grain: { value: 0.4, min: 0, max: 1.5, step: 0.02 },
      grainScale: { value: 1.5, min: 0.5, max: 6, step: 0.1 },
      misregistration: { value: 2.5, min: 0, max: 8, step: 0.1 },
      posterize: { value: 4, min: 1, max: 8, step: 1 },
      ditherStrength: { value: 0.55, min: 0, max: 1.5, step: 0.05 },
    }),
  });

  const flowers: Flower[] = useMemo(() => {
    const rand = mulberry32(controls.seed * 1000 + 7);
    const sources: Record<typeof controls.preset, FlowerType[]> = {
      mixed: ALL_FLOWER_TYPES,
      roses: ["rose"],
      tulips: ["tulip"],
      wild: ["daisy", "lavender", "babys-breath", "chrysanthemum", "iris"],
    };
    const pool = sources[controls.preset];
    const out: Flower[] = [];
    for (let i = 0; i < controls.flowerCount; i++) {
      const t = pool[Math.floor(rand() * pool.length)];
      out.push(defaultFlower(t));
    }
    return out;
  }, [controls.preset, controls.flowerCount, controls.seed]);

  const { placements, domeR, domeH } = useMemo(() => {
    return packBouquet(flowers, controls.seed * 9973 + 1, {
      baseY: controls.baseY,
      pad: controls.pad,
      domeRScale: controls.domeRScale,
      domeHScale: controls.domeHScale,
      headBoundsScale: controls.headBoundsScale,
    });
  }, [flowers, controls.seed, controls.baseY, controls.pad, controls.domeRScale, controls.domeHScale, controls.headBoundsScale]);

  const focusY = controls.baseY + domeH * 0.5;

  const risoConfig: RisoConfig = useMemo(() => {
    const derived = controls.matchFlowers ? deriveInks(flowers) : null;
    return {
      inkA: derived?.inkA ?? controls.inkA,
      inkB: derived?.inkB ?? controls.inkB,
      inkC: derived?.inkC ?? controls.inkC,
      paper: controls.paper,
      grain: controls.grain,
      grainScale: controls.grainScale,
      misregistration: controls.misregistration,
      posterize: controls.posterize,
      ditherStrength: controls.ditherStrength,
    };
  }, [
    controls.matchFlowers,
    controls.inkA,
    controls.inkB,
    controls.inkC,
    controls.paper,
    controls.grain,
    controls.grainScale,
    controls.misregistration,
    controls.posterize,
    controls.ditherStrength,
    flowers,
  ]);

  return (
    <div className="h-screen w-screen bg-cyan-50">
      <Canvas shadows>
        <PerspectiveCamera
          makeDefault
          position={[domeR * 2.4 + 1.2, focusY + domeH * 1.2 + 0.5, domeR * 2.4 + 1.2]}
          fov={35}
        />
        <ambientLight intensity={0.25} />
        <Environment preset="apartment" environmentIntensity={0.55} />
        <directionalLight
          position={[4, 8, 3]}
          intensity={2.2}
          color="#fff5d6"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <directionalLight
          position={[-4, 3, -2]}
          intensity={0.9}
          color="#cce0ff"
        />
        <pointLight
          position={[0, focusY + domeH + 0.6, 0]}
          intensity={1.4}
          color="#ffe9c0"
          distance={5}
          decay={1.6}
        />
        <gridHelper args={[10, 20, "#bbb", "#ddd"]} position={[0, 0, 0]} />

        {placements.map((p, i) => (
          <PlacedFlower
            key={i}
            p={p}
            seed={hashSeed(`${p.flower.type}:${p.flower.color}:${i}`) * 1e9}
            showHead={controls.showHeads}
            showEllipsoid={controls.showEllipsoids}
            showGuide={controls.showStemGuides}
          />
        ))}

        {controls.showDome && (
          <mesh position={[0, controls.baseY, 0]} scale={[domeR, domeH, domeR]}>
            <sphereGeometry
              args={[1, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]}
            />
            <meshBasicMaterial
              color="#3d7eff"
              transparent
              opacity={0.18}
              wireframe
            />
          </mesh>
        )}

        <OrbitControls makeDefault target={[0, focusY, 0]} />
        <PostFx preset={controls.effect as PostFxPreset} riso={risoConfig} />
      </Canvas>
      <div className="absolute bottom-2 left-2 font-mono text-xs bg-white/80 px-2 py-1 rounded">
        {placements.length} flowers · dome r={domeR.toFixed(2)} h={domeH.toFixed(2)} · baseY={controls.baseY.toFixed(2)}
      </div>
    </div>
  );
}
