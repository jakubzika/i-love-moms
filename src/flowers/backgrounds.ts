import type { BackgroundPreset } from "./schema";

export type BackgroundPresetSpec = {
  id: BackgroundPreset;
  title: string;
  description: string;
  css: string;
  foreground: string;
};

export const BACKGROUND_PRESETS: Record<BackgroundPreset, BackgroundPresetSpec> = {
  ivory: {
    id: "ivory",
    title: "Ivory",
    description: "Clean off-white, the default.",
    css: "#fbf7ef",
    foreground: "#2a2421",
  },
  blush: {
    id: "blush",
    title: "Blush",
    description: "Soft pink wash, romantic and warm.",
    css: "linear-gradient(135deg, #fde2e4 0%, #fad2cf 100%)",
    foreground: "#5a2a30",
  },
  sage: {
    id: "sage",
    title: "Sage",
    description: "Muted green, fresh and garden-like.",
    css: "linear-gradient(135deg, #e8efe1 0%, #cfdcc1 100%)",
    foreground: "#2f3d2a",
  },
  "lavender-mist": {
    id: "lavender-mist",
    title: "Lavender Mist",
    description: "Pale violet, calm and dreamy.",
    css: "linear-gradient(135deg, #ece4f5 0%, #d6c8ea 100%)",
    foreground: "#3a2c52",
  },
  "peach-sunset": {
    id: "peach-sunset",
    title: "Peach Sunset",
    description: "Warm peach into apricot.",
    css: "linear-gradient(135deg, #ffe5d0 0%, #ffc6a0 100%)",
    foreground: "#5a2d18",
  },
  midnight: {
    id: "midnight",
    title: "Midnight",
    description: "Deep navy, elegant and contrasted.",
    css: "linear-gradient(135deg, #1f2a44 0%, #2d3b63 100%)",
    foreground: "#f3ecdc",
  },
  buttercream: {
    id: "buttercream",
    title: "Buttercream",
    description: "Pale yellow, sunny and gentle.",
    css: "linear-gradient(135deg, #fff5d6 0%, #ffe7a8 100%)",
    foreground: "#5a4319",
  },
  "rose-quartz": {
    id: "rose-quartz",
    title: "Rose Quartz",
    description: "Cool pink with a porcelain feel.",
    css: "linear-gradient(135deg, #f7d6e0 0%, #e8b4c8 100%)",
    foreground: "#4a1f33",
  },
  white: {
    id: "white",
    title: "White",
    description: "Pure paper white. Maximum clarity.",
    css: "#ffffff",
    foreground: "#111111",
  },
  black: {
    id: "black",
    title: "Black",
    description: "Pure black. Bold and high-contrast.",
    css: "#0a0a0a",
    foreground: "#f5f1e6",
  },
};

export const DEFAULT_BACKGROUND: BackgroundPreset = "ivory";

export function getBackgroundCss(preset: BackgroundPreset | undefined): string {
  return BACKGROUND_PRESETS[preset ?? DEFAULT_BACKGROUND].css;
}
