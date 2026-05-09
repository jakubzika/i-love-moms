import { z } from "zod";

export const ContentSchema = z.object({
  htmlContent: z.string(),
});
export type Content = z.infer<typeof ContentSchema>;

export const BackgroundPresetSchema = z.enum([
  "ivory",
  "blush",
  "sage",
  "lavender-mist",
  "peach-sunset",
  "midnight",
  "buttercream",
  "rose-quartz",
]);
export type BackgroundPreset = z.infer<typeof BackgroundPresetSchema>;

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
  background: BackgroundPresetSchema.default("ivory"),
});
export type FlowerCard = z.infer<typeof FlowerCardSchema>;

export const ALL_FLOWER_TYPES: FlowerType[] = FlowerTypeSchema.options;
export const ALL_BACKGROUND_PRESETS: BackgroundPreset[] =
  BackgroundPresetSchema.options;
