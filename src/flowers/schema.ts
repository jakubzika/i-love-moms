import { z } from "zod";

export const ContentSchema = z.object({
  htmlContent: z.string(),
});
export type Content = z.infer<typeof ContentSchema>;

export const FlowerSizeSchema = z.enum(["small", "medium", "large"]);
export type FlowerSize = z.infer<typeof FlowerSizeSchema>;

export const FlowerTypeSchema = z.enum([
  "rose",
  "tulip",
  "sunflower",
  "daisy",
  "lavender",
  "peony",
  "babys-breath",
  "hydrangea",
  "carnation",
  "lily",
  "iris",
  "chrysanthemum",
]);
export type FlowerType = z.infer<typeof FlowerTypeSchema>;

export const FlowerSchema = z.object({
  type: FlowerTypeSchema,
  color: z.string(),
  size: FlowerSizeSchema.default("medium"),
  stemLength: z.number().positive().optional(),
  quantity: z.number().int().positive().default(1),
});
export type Flower = z.infer<typeof FlowerSchema>;

export const BouquetEntrySchema = z.object({
  type: FlowerTypeSchema,
  count: z.number().int().positive(),
});
export type BouquetEntry = z.infer<typeof BouquetEntrySchema>;

export const BouquetSchema = z.object({
  flowers: z.array(BouquetEntrySchema),
});
export type Bouquet = z.infer<typeof BouquetSchema>;

export const FlowerCardSchema = z.object({
  content: ContentSchema,
  bouquet: BouquetSchema,
});
export type FlowerCard = z.infer<typeof FlowerCardSchema>;

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

export const ALL_FLOWER_TYPES: FlowerType[] = FlowerTypeSchema.options;
