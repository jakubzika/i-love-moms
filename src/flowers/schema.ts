import { z } from "zod";

export const FontPairingSchema = z.enum([
  "editorial",
  "clean",
  "serif-classic",
  "handwritten",
  "display",
  "modern-grotesk",
]);
export type FontPairing = z.infer<typeof FontPairingSchema>;

export const ContentSchema = z.object({
  title: z.string(),
  body: z.string(),
  signature: z.string(),
  fontPairing: FontPairingSchema.default("serif-classic"),
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
  "white",
  "black",
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
export const ALL_FONT_PAIRINGS: FontPairing[] = FontPairingSchema.options;

export type FontPairingSpec = {
  id: FontPairing;
  label: string;
  description: string;
  titleFamily: string;
  bodyFamily: string;
};

export const FONT_PAIRINGS: Record<FontPairing, FontPairingSpec> = {
  editorial: {
    id: "editorial",
    label: "Editorial",
    description: "Fraunces title + Inter body. Modern editorial.",
    titleFamily: "Fraunces",
    bodyFamily: "Inter",
  },
  clean: {
    id: "clean",
    label: "Clean",
    description: "Bricolage Grotesque, single family. Minimal & contemporary.",
    titleFamily: "Bricolage Grotesque",
    bodyFamily: "Bricolage Grotesque",
  },
  "serif-classic": {
    id: "serif-classic",
    label: "Serif Classic",
    description: "Instrument Serif title + Lora body. Refined & quiet.",
    titleFamily: "Instrument Serif",
    bodyFamily: "Lora",
  },
  handwritten: {
    id: "handwritten",
    label: "Handwritten",
    description: "Caveat throughout. Personal note feel.",
    titleFamily: "Caveat",
    bodyFamily: "Caveat",
  },
  display: {
    id: "display",
    label: "Display",
    description: "DM Serif Display + DM Sans. Bold & friendly.",
    titleFamily: "DM Serif Display",
    bodyFamily: "DM Sans",
  },
  "modern-grotesk": {
    id: "modern-grotesk",
    label: "Modern Grotesk",
    description: "Space Grotesk + Manrope. Geometric & tech-forward.",
    titleFamily: "Space Grotesk",
    bodyFamily: "Manrope",
  },
};
