import type { FlowerType } from "./schema";

export type FlowerSize = "small" | "medium" | "large";

export type Flower = {
  type: FlowerType;
  color: string;
  size: FlowerSize;
  stemLength?: number;
  quantity: number;
};

const TYPE_DEFAULTS: Record<FlowerType, { color: string; size: FlowerSize }> = {
  rose:           { color: "#ff5e7a", size: "large" },
  tulip:          { color: "#ffd95a", size: "medium" },
  sunflower:      { color: "#ffc23a", size: "large" },
  daisy:          { color: "#fbfbfb", size: "small" },
  lavender:       { color: "#9fb6ff", size: "small" },
  peony:          { color: "#ff9bb0", size: "large" },
  "babys-breath": { color: "#eaf6ff", size: "small" },
  hydrangea:      { color: "#7fd6e2", size: "large" },
  carnation:      { color: "#3d7eff", size: "medium" },
  lily:           { color: "#fffbe8", size: "large" },
  iris:           { color: "#3a4fb0", size: "medium" },
  chrysanthemum:  { color: "#ffd23a", size: "medium" },
};

export function defaultFlower(type: FlowerType): Flower {
  const d = TYPE_DEFAULTS[type];
  return { type, color: d.color, size: d.size, quantity: 1 };
}

// Preset flowers with specific colors and sizes
export const FLOWER_PRESETS: Record<string, Flower> = {
  redRose: { type: "rose", color: "#ff5e7a", size: "large", quantity: 1 },
  pinkTulip: { type: "tulip", color: "#ff7a90", size: "medium", quantity: 1 },
  yellowTulip: { type: "tulip", color: "#ffd95a", size: "medium", quantity: 1 },
  sunflower: { type: "sunflower", color: "#ffc23a", size: "large", quantity: 1 },
  daisy: { type: "daisy", color: "#fbfbfb", size: "small", quantity: 1 },
  lavender: { type: "lavender", color: "#9fb6ff", size: "small", quantity: 1 },
  peony: { type: "peony", color: "#ff9bb0", size: "large", quantity: 1 },
  babysBreath: { type: "babys-breath", color: "#eaf6ff", size: "small", quantity: 1 },
  hydrangea: { type: "hydrangea", color: "#7fd6e2", size: "large", quantity: 1 },
  carnationRed: { type: "carnation", color: "#3d7eff", size: "medium", quantity: 1 },
  lily: { type: "lily", color: "#fffbe8", size: "large", quantity: 1 },
  iris: { type: "iris", color: "#3a4fb0", size: "medium", quantity: 1 },
  chrysanthemum: { type: "chrysanthemum", color: "#ffd23a", size: "medium", quantity: 1 },
};
