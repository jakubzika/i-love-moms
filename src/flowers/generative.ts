import {
  BufferGeometry,
  BufferAttribute,
  CatmullRomCurve3,
  DoubleSide,
  Quaternion,
  Vector3,
} from "three";
import type { FlowerType } from "./schema";
import type { Flower } from "./flower";
export { DoubleSide, CatmullRomCurve3 };

export const GOLDEN_ANGLE_RAD = Math.PI * (3 - Math.sqrt(5));

export function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 0xffffffff;
}

export function mulberry32(seed: number) {
  let raw =
    Number.isFinite(seed) && seed !== 0
      ? seed < 1 && seed > -1
        ? Math.floor(seed * 0xffffffff)
        : Math.floor(seed)
      : 1;
  let t = raw | 0 || 1;
  return () => {
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export type PetalShape = {
  length: number;
  maxWidth: number;
  tipSharpness: number;
  baseWidth: number;
  segments?: number;
  curl?: number;
  bend?: number;
  cup?: number;
  ruffle?: number;
  twist?: number;
  sideSway?: number;
  edgeWave?: number;
  noiseSeed?: number;
  noiseAmp?: number;
};

function petalWidthAt(t: number, baseWidth: number, maxWidth: number, tipSharpness: number): number {
  const w =
    Math.sin(Math.pow(t, 0.7) * Math.PI) * (1 - tipSharpness * Math.pow(t, 2.5));
  return baseWidth + (maxWidth - baseWidth) * Math.max(0, w);
}

export function petalGeometry({
  length,
  maxWidth,
  tipSharpness,
  baseWidth,
  segments = 22,
  curl = 0.4,
  bend = 0.5,
  cup = 0.35,
  ruffle = 0,
  twist = 0,
  sideSway = 0,
  edgeWave = 0,
  noiseSeed = 0,
  noiseAmp = 0,
}: PetalShape): BufferGeometry {
  const lengthSegs = segments;
  const widthSegs = 12;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const seedF = ((noiseSeed % 1024) + 1024) % 1024;
  const noise2 = (a: number, b: number) => {
    const s = Math.sin(a * 12.9898 + b * 78.233 + seedF * 0.137) * 43758.5453;
    const v = s - Math.floor(s);
    return Number.isFinite(v) ? v * 2 - 1 : 0;
  };

  for (let i = 0; i <= lengthSegs; i++) {
    const t = i / lengthSegs;
    const halfW = petalWidthAt(t, baseWidth, maxWidth, tipSharpness);

    const bendAngle = bend * Math.PI * 0.45 * Math.sin(t * Math.PI * 0.6);
    const py = Math.sin(bendAngle) * length * t;
    const pzCenter = Math.cos(bendAngle) * length * t;
    const tipCurl = curl * Math.pow(t, 2) * length * 0.45;

    const sway = Math.sin(t * Math.PI * 1.4) * sideSway * length * 0.35;
    const twistAngle = twist * Math.PI * 0.25 * t;
    const cosT = Math.cos(twistAngle);
    const sinT = Math.sin(twistAngle);

    for (let j = 0; j <= widthSegs; j++) {
      const u = j / widthSegs;
      const localX = (u - 0.5) * 2 * halfW;

      const cupY = -cup * (1 - Math.pow(Math.abs(u - 0.5) * 2, 1.6)) * halfW * 0.7;
      const ruffleY = Math.sin(u * Math.PI * 5 + t * 9) * ruffle * 0.03;

      const edgeT = Math.pow(Math.abs(u - 0.5) * 2, 2);
      const edgeWaveY = Math.sin(t * Math.PI * 3 + noiseSeed) * edgeWave * 0.08 * edgeT;

      const noiseY = noise2(t * 6, u * 6) * noiseAmp * 0.04 * (0.4 + 0.6 * edgeT);
      const noiseZ = noise2(u * 5 + 9, t * 5 + 4) * noiseAmp * 0.03;

      const yLocal = py + cupY + ruffleY + tipCurl + edgeWaveY + noiseY;
      const zLocal = pzCenter + noiseZ;

      const xT = cosT * localX - sinT * (yLocal - py);
      const yT = sinT * localX + cosT * (yLocal - py) + py;

      positions.push(xT + sway, yT, zLocal);
      uvs.push(u, t);
    }
  }

  for (let i = 0; i < lengthSegs; i++) {
    for (let j = 0; j < widthSegs; j++) {
      const a = i * (widthSegs + 1) + j;
      const b = a + 1;
      const c = a + (widthSegs + 1);
      const d = c + 1;
      indices.push(a, c, b);
      indices.push(b, c, d);
    }
  }

  const geo = new BufferGeometry();
  geo.setAttribute("position", new BufferAttribute(new Float32Array(positions), 3));
  geo.setAttribute("uv", new BufferAttribute(new Float32Array(uvs), 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

export const PETAL_PRESETS = {
  classic: {
    length: 0.6, maxWidth: 0.22, baseWidth: 0.04, tipSharpness: 0.35,
    curl: 0.4, bend: 0.5, cup: 0.3, ruffle: 0,
  },
  spoon: {
    length: 0.55, maxWidth: 0.28, baseWidth: 0.03, tipSharpness: 0.15,
    curl: 0.25, bend: 0.7, cup: 0.55, ruffle: 0,
  },
  needle: {
    length: 0.7, maxWidth: 0.07, baseWidth: 0.015, tipSharpness: 0.85,
    curl: 0.55, bend: 0.4, cup: 0.1, ruffle: 0,
  },
  ruffled: {
    length: 0.5, maxWidth: 0.24, baseWidth: 0.04, tipSharpness: 0.4,
    curl: 0.35, bend: 0.5, cup: 0.3, ruffle: 0.7,
  },
  cup: {
    length: 0.4, maxWidth: 0.3, baseWidth: 0.05, tipSharpness: 0.2,
    curl: 0.15, bend: 0.85, cup: 0.7, ruffle: 0,
  },
  tongue: {
    length: 0.65, maxWidth: 0.16, baseWidth: 0.03, tipSharpness: 0.25,
    curl: 0.7, bend: 0.55, cup: 0.4, ruffle: 0,
  },
  starTip: {
    length: 0.55, maxWidth: 0.18, baseWidth: 0.04, tipSharpness: 0.95,
    curl: 0.3, bend: 0.45, cup: 0.25, ruffle: 0.4,
  },
  heart: {
    length: 0.5, maxWidth: 0.32, baseWidth: 0.06, tipSharpness: 0.05,
    curl: 0.2, bend: 0.6, cup: 0.45, ruffle: 0,
  },
  drooping: {
    length: 0.7, maxWidth: 0.2, baseWidth: 0.04, tipSharpness: 0.3,
    curl: 0.9, bend: 0.95, cup: 0.35, ruffle: 0.2,
  },
  paddle: {
    length: 0.5, maxWidth: 0.34, baseWidth: 0.04, tipSharpness: 0.1,
    curl: 0.1, bend: 0.3, cup: 0.15, ruffle: 0,
  },
  curledTip: {
    length: 0.6, maxWidth: 0.18, baseWidth: 0.035, tipSharpness: 0.45,
    curl: 1.1, bend: 0.4, cup: 0.3, ruffle: 0,
  },
  feather: {
    length: 0.75, maxWidth: 0.1, baseWidth: 0.02, tipSharpness: 0.7,
    curl: 0.5, bend: 0.5, cup: 0.15, ruffle: 0.6,
  },
} satisfies Record<string, PetalShape>;

export type PetalPresetKey = keyof typeof PETAL_PRESETS;

export function petalTipPosition({
  length,
  bend = 0.5,
  curl = 0.4,
}: PetalShape): Vector3 {
  const t = 1;
  const bendAngle = bend * Math.PI * 0.45 * Math.sin(t * Math.PI * 0.6);
  const py = Math.sin(bendAngle) * length * t;
  const pz = Math.cos(bendAngle) * length * t;
  const tipCurl = curl * Math.pow(t, 2) * length * 0.45;
  return new Vector3(0, py + tipCurl, pz);
}

export function phyllotaxisDisc(
  count: number,
  spacing = 0.06,
  startIndex = 1,
): { x: number; z: number; r: number; angle: number }[] {
  const out: { x: number; z: number; r: number; angle: number }[] = [];
  for (let i = 0; i < count; i++) {
    const n = startIndex + i;
    const angle = n * GOLDEN_ANGLE_RAD;
    const r = spacing * Math.sqrt(n);
    out.push({ x: Math.cos(angle) * r, z: Math.sin(angle) * r, r, angle });
  }
  return out;
}

export function ringPositions(
  count: number,
  radius: number,
  phase = 0,
): { x: number; z: number; angle: number }[] {
  return Array.from({ length: count }, (_, i) => {
    const a = phase + (i / count) * Math.PI * 2;
    return { x: Math.cos(a) * radius, z: Math.sin(a) * radius, angle: a };
  });
}

export function sizeScale(size: Flower["size"]): number {
  return size === "large" ? 1.4 : size === "small" ? 0.7 : 1;
}

export type Ellipsoid = { rx: number; ry: number; rz: number };

// Bounds approximate the rendered head's projected extent (petals tilt
// outward, so xz radius >> ring radius). Tuned against buildRecipe geometry.
const HEAD_BOUNDS_BASE: Record<FlowerType, Ellipsoid> = {
  rose:           { rx: 0.55, ry: 0.30, rz: 0.55 },
  tulip:          { rx: 0.32, ry: 0.45, rz: 0.32 },
  sunflower:      { rx: 0.85, ry: 0.20, rz: 0.85 },
  daisy:          { rx: 0.55, ry: 0.12, rz: 0.55 },
  lavender:       { rx: 0.18, ry: 0.55, rz: 0.18 },
  peony:          { rx: 0.60, ry: 0.35, rz: 0.60 },
  "babys-breath": { rx: 0.28, ry: 0.18, rz: 0.28 },
  hydrangea:      { rx: 0.45, ry: 0.28, rz: 0.45 },
  carnation:      { rx: 0.55, ry: 0.30, rz: 0.55 },
  lily:           { rx: 0.70, ry: 0.50, rz: 0.70 },
  iris:           { rx: 0.55, ry: 0.45, rz: 0.55 },
  chrysanthemum:  { rx: 0.65, ry: 0.30, rz: 0.65 },
};

export function headBounds(flower: Flower, scale = 1): Ellipsoid {
  const s = sizeScale(flower.size) * scale;
  const b = HEAD_BOUNDS_BASE[flower.type] ?? { rx: 0.4, ry: 0.3, rz: 0.4 };
  return { rx: b.rx * s, ry: b.ry * s, rz: b.rz * s };
}

export type Placement = {
  index: number;
  flower: Flower;
  base: Vector3;
  head: Vector3;
  normal: Vector3;
  bounds: Ellipsoid;
};

function ellipsoidsOverlap(
  ax: Vector3,
  ar: Ellipsoid,
  bx: Vector3,
  br: Ellipsoid,
  pad: number,
): boolean {
  const dx = ax.x - bx.x;
  const dy = ax.y - bx.y;
  const dz = ax.z - bx.z;
  const sx = ar.rx + br.rx + pad;
  const sy = ar.ry + br.ry + pad;
  const sz = ar.rz + br.rz + pad;
  const norm = (dx * dx) / (sx * sx) + (dy * dy) / (sy * sy) + (dz * dz) / (sz * sz);
  return norm < 1;
}

function domePoint(
  ratio: number,
  spiralIndex: number,
  domeR: number,
  domeH: number,
  baseY: number,
  jitter: () => number,
): { pos: Vector3; normal: Vector3 } {
  const t = Math.max(0, Math.min(1, ratio));
  const angle = spiralIndex * GOLDEN_ANGLE_RAD + jitter() * 0.05;
  const flat = Math.sqrt(t);
  const x = Math.cos(angle) * domeR * flat;
  const z = Math.sin(angle) * domeR * flat;
  const y = baseY + domeH * (1 - t) + (jitter() - 0.5) * 0.04;

  const nx = x / Math.max(0.0001, domeR * domeR);
  const nz = z / Math.max(0.0001, domeR * domeR);
  const ny = ((1 - t) * 2) / Math.max(0.0001, domeH);
  const normal = new Vector3(nx, ny, nz).normalize();
  return { pos: new Vector3(x, y, z), normal };
}

export type PackOptions = {
  baseY?: number;
  pad?: number;
  domeRScale?: number;
  domeHScale?: number;
  candidates?: number;
  headBoundsScale?: number;
  /** Per-flower-type bounds multipliers, applied on top of headBoundsScale. */
  perFlowerBounds?: Partial<
    Record<FlowerType, { rx?: number; ry?: number; rz?: number }>
  >;
};

export function packBouquet(
  flowers: Flower[],
  seed: number,
  opts: PackOptions = {},
): {
  placements: Placement[];
  domeR: number;
  domeH: number;
} {
  const baseY = opts.baseY ?? 1.6;
  const pad = opts.pad ?? 0.02;
  const candidates = opts.candidates ?? 60;
  const rand = mulberry32(seed);

  const boundsScale = opts.headBoundsScale ?? 1;
  const perFlower = opts.perFlowerBounds;
  const indexed = flowers.map((flower, index) => {
    const base = headBounds(flower, boundsScale);
    const ov = perFlower?.[flower.type];
    const bounds: Ellipsoid = ov
      ? {
          rx: base.rx * (ov.rx ?? 1),
          ry: base.ry * (ov.ry ?? 1),
          rz: base.rz * (ov.rz ?? 1),
        }
      : base;
    return {
      flower,
      index,
      bounds,
      headSize: Math.max(bounds.rx, bounds.rz),
    };
  });
  indexed.sort((a, b) => b.headSize - a.headSize);

  const totalArea = indexed.reduce(
    (s, it) => s + Math.PI * (it.bounds.rx + pad) * (it.bounds.rz + pad),
    0,
  );
  let domeR = Math.max(0.4, Math.sqrt(totalArea / Math.PI) * (opts.domeRScale ?? 1.1));
  let domeH = domeR * (opts.domeHScale ?? 0.55);

  const placements: Placement[] = [];

  for (let i = 0; i < indexed.length; i++) {
    const item = indexed[i];
    let placed = false;
    for (let attempt = 0; attempt < 6 && !placed; attempt++) {
      for (let c = 0; c < candidates; c++) {
        const ratio = (c + 0.5) / candidates;
        const spiralIndex = i * candidates + c + attempt * 17;
        const { pos, normal } = domePoint(
          ratio,
          spiralIndex,
          domeR,
          domeH,
          baseY,
          rand,
        );
        const collide = placements.some((p) =>
          ellipsoidsOverlap(pos, item.bounds, p.head, p.bounds, pad),
        );
        if (!collide) {
          const baseRadius = 0.12 + rand() * 0.05;
          const baseAngle = rand() * Math.PI * 2;
          const base = new Vector3(
            Math.cos(baseAngle) * baseRadius,
            0,
            Math.sin(baseAngle) * baseRadius,
          );
          placements.push({
            index: item.index,
            flower: item.flower,
            base,
            head: pos,
            normal,
            bounds: item.bounds,
          });
          placed = true;
          break;
        }
      }
      if (!placed) {
        domeR *= 1.1;
        domeH *= 1.05;
      }
    }
  }

  placements.sort((a, b) => a.index - b.index);
  return { placements, domeR, domeH };
}

export type StemLeaf = {
  key: number;
  position: [number, number, number];
  geometry: BufferGeometry;
  quaternion: Quaternion;
};

export function buildStemLeaves(
  curve: CatmullRomCurve3,
  seed: number,
): StemLeaf[] {
  const rand = mulberry32(seed * 7 + 1);
  const count = 1 + Math.floor(rand() * 2);
  return Array.from({ length: count }, (_, i) => {
    const t = 0.25 + rand() * 0.45 + i * 0.18;
    const tt = Math.min(0.9, t);
    const pos = curve.getPoint(tt);
    const tangent = curve.getTangent(tt).normalize();
    const yaw = rand() * Math.PI * 2;
    const length = 0.18 + rand() * 0.12;
    const maxWidth = 0.07 + rand() * 0.04;
    const geom = petalGeometry({
      length,
      maxWidth,
      baseWidth: 0.012,
      tipSharpness: 0.5,
      curl: 0.2,
      bend: 0.3,
      cup: 0.15,
      ruffle: 0,
      noiseAmp: 0.1,
      noiseSeed: i,
    });
    const leafUp = new Vector3(0, 1, 0);
    const align = new Quaternion().setFromUnitVectors(leafUp, tangent);
    const yawQ = new Quaternion().setFromAxisAngle(leafUp, yaw);
    const tiltQ = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -0.6);
    return {
      key: i,
      position: [pos.x, pos.y, pos.z],
      quaternion: align.clone().multiply(yawQ).multiply(tiltQ),
      geometry: geom,
    };
  });
}

export function makeBendableStemCurve(
  base: Vector3,
  head: Vector3,
  seed: number,
): CatmullRomCurve3 {
  const rand = mulberry32(seed);
  const dir = new Vector3().subVectors(head, base);
  const len = dir.length();
  const up = new Vector3(0, 1, 0);

  const lateral = new Vector3(dir.x, 0, dir.z);
  const lateralLen = lateral.length();
  if (lateralLen > 0.001) lateral.normalize();
  else lateral.set(1, 0, 0);

  // Early control: rises mostly upward but already drifts toward the head,
  // avoiding the sharp kink the previous "pure up" point produced.
  const liftPoint = new Vector3()
    .copy(base)
    .addScaledVector(dir, 0.18)
    .addScaledVector(up, 0.18 * len + rand() * 0.03 * len);

  // Mid control sits nicely above the straight base→head line so the curve
  // sweeps as a smooth arc instead of dipping below it.
  const midPoint = new Vector3()
    .copy(base)
    .addScaledVector(dir, 0.5)
    .addScaledVector(up, 0.12 * len)
    .addScaledVector(lateral, (rand() - 0.5) * 0.02 * lateralLen);

  // Approach the head straight on (along dir) so the tip doesn't whip.
  const approachPoint = new Vector3()
    .copy(head)
    .addScaledVector(dir, -0.12);

  return new CatmullRomCurve3(
    [base, liftPoint, midPoint, approachPoint, head],
    false,
    "catmullrom",
    // Lower tension = gentler curve through control points (less swing).
    0.3,
  );
}
