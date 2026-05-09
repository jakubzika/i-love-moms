import { z } from "zod";

export const ContentSchema = z.object({
  htmlContent: z.string(),
});
export type Content = z.infer<typeof ContentSchema>;

export const FlowerSizeSchema = z.enum(["small", "medium", "large"]);
export type FlowerSize = z.infer<typeof FlowerSizeSchema>;

export const BaseFlowerSchema = z.object({
  color: z.string(),
  size: FlowerSizeSchema.default("medium"),
  stemLength: z.number().positive().optional(),
  quantity: z.number().int().positive().default(1),
});
export type BaseFlower = z.infer<typeof BaseFlowerSchema>;

export const RoseSchema = BaseFlowerSchema.extend({
  type: z.literal("rose"),
  thorns: z.boolean().default(true),
});
export type Rose = z.infer<typeof RoseSchema>;

export const TulipSchema = BaseFlowerSchema.extend({
  type: z.literal("tulip"),
});
export type Tulip = z.infer<typeof TulipSchema>;

export const SunflowerSchema = BaseFlowerSchema.extend({
  type: z.literal("sunflower"),
  faceDiameterCm: z.number().positive().optional(),
});
export type Sunflower = z.infer<typeof SunflowerSchema>;

export const DaisySchema = BaseFlowerSchema.extend({
  type: z.literal("daisy"),
});
export type Daisy = z.infer<typeof DaisySchema>;

export const LavenderSchema = BaseFlowerSchema.extend({
  type: z.literal("lavender"),
  fragrant: z.boolean().default(true),
});
export type Lavender = z.infer<typeof LavenderSchema>;

export const PeonySchema = BaseFlowerSchema.extend({
  type: z.literal("peony"),
});
export type Peony = z.infer<typeof PeonySchema>;

export const BabysBreathSchema = BaseFlowerSchema.extend({
  type: z.literal("babys-breath"),
});
export type BabysBreath = z.infer<typeof BabysBreathSchema>;

export const HydrangeaSchema = BaseFlowerSchema.extend({
  type: z.literal("hydrangea"),
});
export type Hydrangea = z.infer<typeof HydrangeaSchema>;

export const CarnationSchema = BaseFlowerSchema.extend({
  type: z.literal("carnation"),
});
export type Carnation = z.infer<typeof CarnationSchema>;

export const LilySchema = BaseFlowerSchema.extend({
  type: z.literal("lily"),
});
export type Lily = z.infer<typeof LilySchema>;

export const IrisSchema = BaseFlowerSchema.extend({
  type: z.literal("iris"),
});
export type Iris = z.infer<typeof IrisSchema>;

export const ChrysanthemumSchema = BaseFlowerSchema.extend({
  type: z.literal("chrysanthemum"),
});
export type Chrysanthemum = z.infer<typeof ChrysanthemumSchema>;

export const FlowerSchema = z.discriminatedUnion("type", [
  RoseSchema,
  TulipSchema,
  SunflowerSchema,
  DaisySchema,
  LavenderSchema,
  PeonySchema,
  BabysBreathSchema,
  HydrangeaSchema,
  CarnationSchema,
  LilySchema,
  IrisSchema,
  ChrysanthemumSchema,
]);
export type Flower = z.infer<typeof FlowerSchema>;
export type FlowerType = Flower["type"];

export const BouquetSchema = z.object({
  flowers: z.array(FlowerSchema),
});
export type Bouquet = z.infer<typeof BouquetSchema>;

export const FlowerCardSchema = z.object({
  content: ContentSchema,
  bouquet: BouquetSchema,
});
export type FlowerCard = z.infer<typeof FlowerCardSchema>;

export const FLOWER_PRESETS = {
  redRose: { type: "rose", color: "#c0392b", size: "large", quantity: 1, thorns: true },
  pinkRose: { type: "rose", color: "#ff69b4", size: "medium", quantity: 1, thorns: true },
  whiteRose: { type: "rose", color: "#fafafa", size: "medium", quantity: 1, thorns: false },
  yellowTulip: { type: "tulip", color: "#ffd166", size: "medium", quantity: 1 },
  pinkTulip: { type: "tulip", color: "#ff85a1", size: "medium", quantity: 1 },
  sunflower: { type: "sunflower", color: "#f4a300", size: "large", quantity: 1, faceDiameterCm: 18 },
  daisy: { type: "daisy", color: "#ffffff", size: "small", quantity: 1 },
  lavender: { type: "lavender", color: "#9b7cb6", size: "small", quantity: 3, fragrant: true },
  peony: { type: "peony", color: "#ffb6c1", size: "large", quantity: 1 },
  babysBreath: { type: "babys-breath", color: "#fffafa", size: "small", quantity: 6 },
  hydrangea: { type: "hydrangea", color: "#7fb3d5", size: "large", quantity: 1 },
  carnationRed: { type: "carnation", color: "#e74c3c", size: "medium", quantity: 1 },
  lily: { type: "lily", color: "#fff5e1", size: "large", quantity: 1 },
  iris: { type: "iris", color: "#5b3a8c", size: "medium", quantity: 1 },
  chrysanthemum: { type: "chrysanthemum", color: "#f1c40f", size: "medium", quantity: 1 },
} satisfies Record<string, Flower>;

export type FlowerPresetKey = keyof typeof FLOWER_PRESETS;
