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
