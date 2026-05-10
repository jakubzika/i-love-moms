"use client";

import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { Color, Quaternion, Vector3 } from "three";
import { BACKGROUND_PRESETS, getBackgroundCss } from "./backgrounds";
import { CARD_SIZE } from "./constants";
import { defaultFlower, type Flower } from "./flower";
import {
  buildStemLeaves,
  hashSeed,
  makeBendableStemCurve,
  mulberry32,
  packBouquet,
  petalGeometry,
  phyllotaxisDisc,
  ringPositions,
  sizeScale,
  type PetalShape,
} from "./generative";
import {
  STEM_PALETTE,
  createRisoPetalMaterial,
  createRisoStemMaterial,
  getFlowerPalette,
  setRisoUniforms,
  type RisoOverrides,
} from "./risoMaterial";
import type { FlowerCard, FlowerType } from "./schema";
import { CardTextCanvas } from "./card-text-canvas";

export type FlowerBoundsOverride = {
  /** Multiplier on rx (default 1). */
  rx?: number;
  /** Multiplier on ry (default 1). */
  ry?: number;
  /** Multiplier on rz (default 1). */
  rz?: number;
};

export type BouquetOptions = {
  /** Per-flower-type scale multiplier (1 = default). Lets you shrink/grow specific flowers. */
  perFlowerScale?: Partial<Record<FlowerType, number>>;
  /** Per-flower-type collision-box (head bounds) multipliers. */
  perFlowerBounds?: Partial<Record<FlowerType, FlowerBoundsOverride>>;
  /** Stem base Y position. */
  baseY?: number;
  /** Final scale fits the bouquet so its dome radius hits this target. */
  targetDomeR?: number;
  /** Padding between flower heads in the packing pass. */
  pad?: number;
  /** Scales the auto-computed dome radius. */
  domeRScale?: number;
  /** Scales the dome height (relative to radius). */
  domeHScale?: number;
  /** Multiplies each flower's head ellipsoid bounds (global). */
  headBoundsScale?: number;
  /** Random seed for placement. */
  seed?: number;
  /** Show wireframe ellipsoid debug overlays at each flower's collision bounds. */
  showBounds?: boolean;
  /** Global riso shader overrides applied to petals, centers, and stems. */
  riso?: RisoOverrides;
};

type PetalLayer = {
  count: number;
  radius: number;
  tilt: number;
  petal: PetalShape;
  yOffset?: number;
  twist?: number;
  colorMix?: number;
  rollPhase?: number;
};

type FlowerRecipe = {
  layers: PetalLayer[];
  centerColor?: string;
  centerRadius?: number;
  centerCount?: number;
  centerHeight?: number;
};

function shade(hex: string, amount: number): string {
  const c = new Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  hsl.l = Math.min(1, Math.max(0, hsl.l + amount));
  c.setHSL(hsl.h, hsl.s, hsl.l);
  return `#${c.getHexString()}`;
}

function PetalLayerMesh({
  layer,
  scale,
  baseColor,
  flowerType,
  seedOffset,
  layerSeed,
}: {
  layer: PetalLayer;
  scale: number;
  baseColor: string;
  flowerType: FlowerType;
  seedOffset: number;
  layerSeed: number;
}) {
  const positions = useMemo(
    () => ringPositions(layer.count, layer.radius, seedOffset),
    [layer.count, layer.radius, seedOffset],
  );

  const instances = useMemo(() => {
    const rand = mulberry32(layerSeed);
    return positions.map((pos, i) => {
      const sizeJitter = 0.85 + rand() * 0.3;
      const twistJitter = (rand() - 0.5) * 0.3;
      const ruffleJitter = rand() * 0.12;
      const noiseAmp = 0.2 + rand() * 0.4;
      const colorJitter = (rand() - 0.5) * 0.08;
      const tiltJitter = (rand() - 0.5) * 0.18;
      const petal = {
        ...layer.petal,
        length: layer.petal.length * sizeJitter,
        maxWidth: layer.petal.maxWidth * (0.9 + rand() * 0.25),
        twist: (layer.petal.twist ?? 0) + twistJitter,
        ruffle: (layer.petal.ruffle ?? 0) + ruffleJitter,
        noiseAmp: (layer.petal.noiseAmp ?? 0) + noiseAmp,
        noiseSeed: layerSeed * 31 + i,
      };
      const geom = petalGeometry(petal);
      const color = shade(
        baseColor,
        (layer.colorMix ?? 0) * 0.18 + colorJitter,
      );
      return { geom, color, pos, i, tiltJitter };
    });
  }, [positions, layer, baseColor, layerSeed]);

  const palette = useMemo(() => getFlowerPalette(flowerType), [flowerType]);

  return (
    <group position={[0, layer.yOffset ?? 0, 0]} scale={scale}>
      {instances.map(({ geom, color, pos, i, tiltJitter }) => {
        const twist = (layer.twist ?? 0) * (i / layer.count);
        return (
          <RisoPetalMesh
            key={i}
            geometry={geom}
            position={[pos.x, 0, pos.z]}
            rotation={[layer.tilt + tiltJitter, -pos.angle + twist, 0]}
            color={color}
            palette={palette}
          />
        );
      })}
    </group>
  );
}

function RisoPetalMesh({
  geometry,
  position,
  rotation,
  color,
  palette,
}: {
  geometry: import("three").BufferGeometry;
  position: [number, number, number];
  rotation: [number, number, number];
  color: string;
  palette: ReturnType<typeof getFlowerPalette>;
}) {
  const material = useMemo(
    () => createRisoPetalMaterial({ baseColor: color, palette }),
    [color, palette],
  );
  return (
    <mesh
      geometry={geometry}
      position={position}
      rotation={rotation}
      material={material}
    />
  );
}

function FlowerCenter({
  color,
  radius,
  count,
  height,
  scale,
  palette,
}: {
  color: string;
  radius: number;
  count: number;
  height: number;
  scale: number;
  palette: ReturnType<typeof getFlowerPalette>;
}) {
  const seeds = useMemo(
    () => phyllotaxisDisc(count, radius / Math.sqrt(count + 1)),
    [count, radius],
  );
  const discMaterial = useMemo(
    () =>
      createRisoPetalMaterial({
        baseColor: color,
        palette,
        doubleSide: false,
      }),
    [color, palette],
  );
  const seedColor = shade(color, -0.15);
  const seedMaterial = useMemo(
    () =>
      createRisoPetalMaterial({
        baseColor: seedColor,
        palette,
        doubleSide: false,
      }),
    [seedColor, palette],
  );
  return (
    <group scale={scale}>
      <mesh material={discMaterial}>
        <cylinderGeometry args={[radius, radius * 0.95, height, 32]} />
      </mesh>
      {seeds.map(({ x, z }, i) => (
        <mesh
          key={i}
          position={[x, height / 2 + 0.005, z]}
          material={seedMaterial}
        >
          <sphereGeometry args={[Math.max(0.012, radius * 0.06), 6, 6]} />
        </mesh>
      ))}
    </group>
  );
}

function buildRecipe(flower: Flower, rand: () => number): FlowerRecipe {
  switch (flower.type) {
    case "rose": {
      const petalsPerLayer = 8;
      const layers: PetalLayer[] = [];
      for (let i = 0; i < 5; i++) {
        const t = i / 5;
        layers.push({
          count: petalsPerLayer + i * 2,
          radius: 0.05 + t * 0.35,
          tilt: -1.1 + t * 0.9,
          twist: 0.4 + rand() * 0.3,
          colorMix: -0.15 + t * 0.25,
          yOffset: 0.04 - t * 0.04,
          petal: {
            length: 0.42 + t * 0.12,
            maxWidth: 0.22 + t * 0.04,
            baseWidth: 0.04,
            tipSharpness: 0.55 - t * 0.2,
            curl: 0.1 - t * 0.35,
            ruffle: 0,
            noiseAmp: 0.15,
          },
        });
      }
      return { layers };
    }
    case "tulip": {
      return {
        layers: [
          {
            count: 3,
            radius: 0.05,
            tilt: -0.4,
            petal: {
              length: 0.6,
              maxWidth: 0.28,
              baseWidth: 0.05,
              tipSharpness: 0.25,
              curl: 0.5,
            },
          },
          {
            count: 3,
            radius: 0.07,
            tilt: -0.3,
            rollPhase: Math.PI / 3,
            petal: {
              length: 0.55,
              maxWidth: 0.26,
              baseWidth: 0.04,
              tipSharpness: 0.3,
              curl: 0.45,
            },
          },
        ],
      };
    }
    case "sunflower": {
      return {
        layers: [
          {
            count: 24,
            radius: 0.42,
            tilt: -0.15,
            petal: {
              length: 0.55,
              maxWidth: 0.13,
              baseWidth: 0.04,
              tipSharpness: 0.55,
              curl: 0.05,
            },
            colorMix: 0.05,
          },
          {
            count: 24,
            radius: 0.4,
            tilt: -0.05,
            rollPhase: Math.PI / 24,
            petal: {
              length: 0.42,
              maxWidth: 0.12,
              baseWidth: 0.03,
              tipSharpness: 0.6,
              curl: 0.02,
            },
            colorMix: -0.05,
            yOffset: 0.03,
          },
        ],
        centerColor: "#5a3a1a",
        centerRadius: 0.34,
        centerCount: 90,
        centerHeight: 0.07,
      };
    }
    case "daisy": {
      return {
        layers: [
          {
            count: 14,
            radius: 0.18,
            tilt: -0.05,
            petal: {
              length: 0.45,
              maxWidth: 0.1,
              baseWidth: 0.03,
              tipSharpness: 0.45,
              curl: 0.1,
            },
          },
        ],
        centerColor: "#f1c40f",
        centerRadius: 0.16,
        centerCount: 36,
        centerHeight: 0.04,
      };
    }
    case "lavender": {
      const layerCount = 6;
      const step = 0.13;
      return {
        layers: Array.from({ length: layerCount }, (_, i) => ({
          count: 6,
          radius: 0.06,
          tilt: -0.5,
          yOffset: -0.1 + i * step,
          rollPhase: i * 0.4,
          petal: {
            length: 0.14,
            maxWidth: 0.08,
            baseWidth: 0.02,
            tipSharpness: 0.6,
            curl: 0.1,
          },
          colorMix: -0.05 + i * 0.04,
        })),
      };
    }
    case "peony": {
      const layers: PetalLayer[] = [];
      for (let i = 0; i < 6; i++) {
        const t = i / 6;
        layers.push({
          count: 10 + i * 3,
          radius: 0.05 + t * 0.42,
          tilt: -1.2 + t * 1.1,
          twist: 0.3 + rand() * 0.4,
          colorMix: -0.1 + t * 0.2,
          yOffset: 0.05 - t * 0.05,
          petal: {
            length: 0.32 + t * 0.18,
            maxWidth: 0.2 + t * 0.06,
            baseWidth: 0.04,
            tipSharpness: 0.4 - t * 0.25,
            curl: 0.7 - t * 0.5,
          },
        });
      }
      return { layers };
    }
    case "babys-breath": {
      return {
        layers: [
          {
            count: 7,
            radius: 0.04,
            tilt: -0.5,
            petal: {
              length: 0.12,
              maxWidth: 0.07,
              baseWidth: 0.02,
              tipSharpness: 0.4,
              curl: 0.2,
            },
          },
        ],
        centerColor: "#fff8e0",
        centerRadius: 0.05,
        centerCount: 8,
        centerHeight: 0.02,
      };
    }
    case "hydrangea": {
      const layers: PetalLayer[] = [];
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2;
        layers.push({
          count: 4,
          radius: 0.05,
          tilt: -0.5,
          rollPhase: a,
          yOffset: Math.sin(i * 0.7) * 0.04,
          colorMix: -0.05 + (i % 3) * 0.05,
          petal: {
            length: 0.18,
            maxWidth: 0.14,
            baseWidth: 0.03,
            tipSharpness: 0.25,
            curl: 0.15,
          },
        });
      }
      return { layers };
    }
    case "carnation": {
      const layers: PetalLayer[] = [];
      for (let i = 0; i < 6; i++) {
        const t = i / 6;
        layers.push({
          count: 12 + i * 2,
          radius: 0.04 + t * 0.32,
          tilt: -1.0 + t * 0.9,
          twist: 0.6,
          rollPhase: i * 0.25,
          colorMix: -0.08 + t * 0.15,
          yOffset: 0.04 - t * 0.04,
          petal: {
            length: 0.3 + t * 0.12,
            maxWidth: 0.16,
            baseWidth: 0.025,
            tipSharpness: 0.7,
            curl: 0.35 - t * 0.2,
          },
        });
      }
      return { layers };
    }
    case "lily": {
      return {
        layers: [
          {
            count: 6,
            radius: 0.12,
            tilt: -0.6,
            petal: {
              length: 0.7,
              maxWidth: 0.17,
              baseWidth: 0.03,
              tipSharpness: 0.55,
              curl: 0.45,
            },
          },
        ],
        centerColor: "#b58a3d",
        centerRadius: 0.05,
        centerCount: 6,
        centerHeight: 0.04,
      };
    }
    case "iris": {
      return {
        layers: [
          {
            count: 3,
            radius: 0.05,
            tilt: -1.0,
            petal: {
              length: 0.6,
              maxWidth: 0.22,
              baseWidth: 0.04,
              tipSharpness: 0.35,
              curl: 0.6,
            },
          },
          {
            count: 3,
            radius: 0.05,
            tilt: -0.2,
            rollPhase: Math.PI / 3,
            colorMix: 0.1,
            petal: {
              length: 0.55,
              maxWidth: 0.2,
              baseWidth: 0.04,
              tipSharpness: 0.4,
              curl: 0.3,
            },
          },
        ],
      };
    }
    case "chrysanthemum": {
      const layers: PetalLayer[] = [];
      for (let i = 0; i < 5; i++) {
        const t = i / 5;
        layers.push({
          count: 18 + i * 4,
          radius: 0.06 + t * 0.34,
          tilt: -0.9 + t * 0.7,
          rollPhase: i * 0.18,
          colorMix: -0.08 + t * 0.12,
          yOffset: 0.04 - t * 0.04,
          petal: {
            length: 0.25 + t * 0.18,
            maxWidth: 0.07,
            baseWidth: 0.018,
            tipSharpness: 0.75,
            curl: 0.5 - t * 0.3,
          },
        });
      }
      return { layers };
    }
  }
}

let __headRecipeCount = 0;
export function FlowerHead({ flower }: { flower: Flower }) {
  const override = (flower as Flower & { __scaleOverride?: number })
    .__scaleOverride;
  const scale = override ?? sizeScale(flower.size);
  const recipe = useMemo(() => {
    __headRecipeCount++;
    console.log(
      "[perf] head recipe",
      __headRecipeCount,
      flower.type,
    );
    const seed = hashSeed(`${flower.type}:${flower.color}`);
    const rand = mulberry32(seed);
    return buildRecipe(flower, rand);
  }, [flower]);

  const baseSeed = useMemo(
    () => hashSeed(`${flower.type}:${flower.color}`),
    [flower.type, flower.color],
  );

  const palette = useMemo(() => getFlowerPalette(flower.type), [flower.type]);

  return (
    <group>
      {recipe.layers.map((layer, i) => (
        <PetalLayerMesh
          key={i}
          layer={layer}
          scale={scale}
          baseColor={flower.color}
          flowerType={flower.type}
          seedOffset={layer.rollPhase ?? 0}
          layerSeed={baseSeed * 1000 + i}
        />
      ))}
      {recipe.centerColor && (
        <FlowerCenter
          color={recipe.centerColor}
          radius={(recipe.centerRadius ?? 0.1) * scale}
          count={recipe.centerCount ?? 30}
          height={recipe.centerHeight ?? 0.04}
          scale={1}
          palette={palette}
        />
      )}
    </group>
  );
}

// Module-level counter for stem rebuilds — useful to see whether a tiny
// state change is causing all N stems to recompute their tube geometry.
let __stemBuildCount = 0;
function BendableStem({
  base,
  head,
  normal,
  flower,
  seed,
}: {
  base: Vector3;
  head: Vector3;
  normal: Vector3;
  flower: Flower;
  seed: number;
}) {
  const { curve, stemRadius, quaternion, stemColor } = useMemo(() => {
    __stemBuildCount++;
    console.log("[perf] stem build", __stemBuildCount, "seed=" + seed);
    const c = makeBendableStemCurve(base, head, seed);
    const rand = mulberry32(seed);
    const radius = 0.009 + rand() * 0.006;
    const up = new Vector3(0, 1, 0);
    const q = new Quaternion().setFromUnitVectors(
      up,
      normal.clone().normalize(),
    );
    const greens = [
      "#a8c98a",
      "#bdd89e",
      "#94b97a",
      "#c0d6a8",
      "#a3c97a",
      "#9bbf7e",
    ];
    const stem = greens[Math.floor(rand() * greens.length)];
    return {
      curve: c,
      stemRadius: radius,
      quaternion: q,
      stemColor: stem,
    };
  }, [base, head, normal, seed]);

  const material = useMemo(
    () => createRisoStemMaterial(stemColor),
    [stemColor],
  );

  const leafMaterial = useMemo(
    () =>
      createRisoPetalMaterial({
        baseColor: stemColor,
        palette: STEM_PALETTE,
        doubleSide: true,
      }),
    [stemColor],
  );
  // Leaves use the green stem palette so the riso projection keeps them
  // green; double-sided because leaves are thin and need to read from
  // either side.

  const leaves = useMemo(() => buildStemLeaves(curve, seed), [curve, seed]);

  return (
    <group>
      <mesh material={material}>
        <tubeGeometry args={[curve, 36, stemRadius, 10, false]} />
      </mesh>
      {leaves.map((l) => (
        <mesh
          key={l.key}
          geometry={l.geometry}
          position={l.position}
          quaternion={l.quaternion}
          material={leafMaterial}
        />
      ))}
      <group position={[head.x, head.y, head.z]} quaternion={quaternion}>
        <FlowerHead flower={flower} />
      </group>
    </group>
  );
}

function Bouquet({ card, options }: { card: FlowerCard; options?: BouquetOptions }) {
  // Push riso uniforms to the global shared store. Mutates uniforms directly
  // on every cached material — no rebuild, no recompile.
  useEffect(() => {
    if (options?.riso) setRisoUniforms(options.riso);
  }, [options?.riso]);

  // Render counter — logs every Bouquet render so we can see how often
  // the whole 3D scene wants to rebuild on parameter changes.
  const renderCount = useRef(0);
  renderCount.current++;
  console.log("[perf] Bouquet render", renderCount.current);

  const expanded = useMemo(
    () => {
      console.time("[perf] Bouquet.expanded");
      const out = (card.bouquet?.flowers ?? []).flatMap((entry, ei) =>
        Array.from({ length: Math.max(1, entry.count) }, (_, qi) => {
          const flower = defaultFlower(entry.type);
          const sizeOverride = options?.perFlowerScale?.[entry.type];
          if (sizeOverride !== undefined) {
            (flower as Flower & { __scaleOverride?: number }).__scaleOverride =
              sizeOverride;
          }
          return {
            flower,
            key: `${ei}-${qi}`,
            seed: hashSeed(`${flower.type}:${flower.color}:${ei}:${qi}`),
          };
        }),
      );
      console.timeEnd("[perf] Bouquet.expanded");
      return out;
    },
    // Depend only on the bouquet field, NOT the whole card. Title/body
    // changes don't affect flower placement.
    [card.bouquet, options?.perFlowerScale],
  );

  const baseY = options?.baseY ?? 1.6;
  const targetDomeR = options?.targetDomeR ?? 4.6;
  const { placements, domeR } = useMemo(() => {
    const seed = hashSeed(`bouquet:${expanded.length}:${options?.seed ?? 0}`);
    return packBouquet(
      expanded.map((e) => e.flower),
      Math.floor(seed * 1e9) + (options?.seed ?? 0),
      {
        baseY,
        pad: options?.pad,
        domeRScale: options?.domeRScale,
        domeHScale: options?.domeHScale,
        headBoundsScale: options?.headBoundsScale,
        perFlowerBounds: options?.perFlowerBounds,
      },
    );
  }, [
    expanded,
    baseY,
    options?.pad,
    options?.domeRScale,
    options?.domeHScale,
    options?.headBoundsScale,
    options?.perFlowerBounds,
    options?.seed,
  ]);

  const scale = Math.min(4, Math.max(0.6, targetDomeR / Math.max(domeR, 0.2)));

  return (
    <group position={[0, baseY * (1 - scale), 0]} scale={scale}>
      {placements.map((p, i) => (
        <BendableStem
          key={expanded[i].key}
          base={p.base}
          head={p.head}
          normal={p.normal}
          flower={p.flower}
          seed={Math.floor(expanded[i].seed * 1e9)}
        />
      ))}
      {options?.showBounds
        ? placements.map((p, i) => (
            <group
              key={`bounds-${expanded[i].key}`}
              position={[p.head.x, p.head.y, p.head.z]}
              scale={[p.bounds.rx, p.bounds.ry, p.bounds.rz]}
            >
              <mesh>
                <sphereGeometry args={[1, 16, 12]} />
                <meshBasicMaterial
                  color="#3d7eff"
                  transparent
                  opacity={0.18}
                  depthWrite={false}
                  wireframe
                />
              </mesh>
            </group>
          ))
        : null}
    </group>
  );
}

export function FlowerCardPreview({
  card,
  bouquetOptions,
  size,
  flowersInFront = false,
}: {
  card: FlowerCard;
  bouquetOptions?: BouquetOptions;
  /** Optional CSS size override. Defaults to CARD_SIZE. */
  size?: { width: number; height: number };
  /** When true, the 3D flowers render on top of the text. */
  flowersInFront?: boolean;
}) {
  const backgroundCss = getBackgroundCss(card.background);
  const w = size?.width ?? CARD_SIZE.width;
  const h = size?.height ?? CARD_SIZE.height;
  return (
    <div
      data-card-preview="true"
      className="mx-auto overflow-hidden relative"
      style={{
        width: w,
        height: h,
        background: backgroundCss,
        // Force a stacking context so the canvas/text z-index swap below
        // is contained to this box.
        isolation: "isolate",
      }}
    >
      <Canvas
        frameloop="demand"
        gl={{ preserveDrawingBuffer: true }}
        style={{
          background: "transparent",
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          // Layer-order toggle: 3 keeps the WebGL on top of the text
          // canvas (z=2) when flowersInFront is true; 1 puts text above.
          zIndex: flowersInFront ? 3 : 1,
        }}
      >
        <PerspectiveCamera
          makeDefault
          position={[12.24, 24.9, 12.95]}
          fov={35}
          near={0.1}
          far={50}
        />
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 8, 5]} intensity={1.1} />
        <Bouquet card={card} options={bouquetOptions} />
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.26, 0]}
        >
          {/* <planeGeometry args={[20, 20]} /> */}
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <OrbitControls
          makeDefault
          target={[2.01, 0.15, 1.82]}
          onChange={(e) => {
            const cam = e?.target.object;
            if (!cam) return;
            const p = cam.position;
            const t = e.target.target;
            // eslint-disable-next-line no-console
            // console.log(
            //   `camera position=[${p.x.toFixed(2)}, ${p.y.toFixed(2)}, ${p.z.toFixed(2)}] target=[${t.x.toFixed(2)}, ${t.y.toFixed(2)}, ${t.z.toFixed(2)}]`,
            // );
          }}
        />
      </Canvas>
      {/* Text rendered via Pretext + Canvas2D. Same pixels live and
          on download — no DOM/SVG/font-loading dance. */}
      <CardTextCanvas
        card={card}
        width={w}
        height={h}
        className="absolute left-0 top-0 pointer-events-none"
        style={{ zIndex: 2 }}
      />
    </div>
  );
}

export const FlowerRender = () => {
  return <div className="w-full h-full bg-pink-400">KYTKA</div>;
};
