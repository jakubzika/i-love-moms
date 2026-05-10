import {
  ALL_BACKGROUND_PRESETS,
  ALL_FLOWER_TYPES,
  type BackgroundPreset,
  type FlowerType,
} from "./schema";

const MAIN_TYPES: FlowerType[] = [
  "rose",
  "tulip",
  "sunflower",
  "peony",
  "lily",
  "iris",
  "chrysanthemum",
];

const FILLER_TYPES: FlowerType[] = [
  "babys-breath",
  "lavender",
  "hydrangea",
  "carnation",
  "daisy",
];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const ZERO_COUNTS = ALL_FLOWER_TYPES.reduce(
  (acc, t) => ({ ...acc, [t]: 0 }),
  {} as Record<FlowerType, number>,
);

/** A simple "main flower + filler" arrangement: one focal type and one
 * airy filler type. Counts are tuned to look full without overcrowding. */
export function randomBouquetCounts(): Record<FlowerType, number> {
  const main = pick(MAIN_TYPES);
  const filler = pick(FILLER_TYPES);
  return {
    ...ZERO_COUNTS,
    [main]: 5 + Math.floor(Math.random() * 6), // 5–10
    [filler]: 7 + Math.floor(Math.random() * 8), // 7–14
  };
}

export function randomBackground(): BackgroundPreset {
  return pick(ALL_BACKGROUND_PRESETS);
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 100);
}
