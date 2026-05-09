import { z } from "zod";

export const ContentSchema = z.object({
  htmlContent: z.string(),
});

export const FlowerSchema = z.object({
  color: z.string(),
  type: z.string(),
  size: z.enum(["small", "medium", "large"]).default("medium"),
  stemLength: z.number().positive().optional(),
  quantity: z.number().int().positive().default(1),
});

export const BouquetSchema = z.object({
  flowers: z.array(FlowerSchema),
});

export const FlowerCardSchema = z.object({
  content: ContentSchema,
  bouquet: BouquetSchema,
});

export type Content = z.infer<typeof ContentSchema>;
export type Flower = z.infer<typeof FlowerSchema>;
export type Bouquet = z.infer<typeof BouquetSchema>;
export type FlowerCard = z.infer<typeof FlowerCardSchema>;
