export const CARD_SIZE = {
  width: 600,
  height: 800,
  previewMinHeight: 480,
} as const;
export type CardSize = typeof CARD_SIZE;
