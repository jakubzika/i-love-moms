import { FLOWER_PRESETS, type Flower } from "@/flowers/flower";
import { BACKGROUND_PRESETS } from "@/flowers/backgrounds";
import {
  ALL_BACKGROUND_PRESETS,
  type BackgroundPreset,
  type FlowerCard,
  type FlowerType,
} from "@/flowers/schema";
import type { FlowerCardProposal } from "./flower-tool-types";

type FlowerTypeOption = {
  type: FlowerType;
  title: string;
  description: string;
};

type FlowerTypeVariation = {
  id: string;
  title: string;
  description: string;
  flowers: Array<{
    type: FlowerType;
    quantity: number;
  }>;
};

export const flowerTypeOptions: FlowerTypeOption[] = [
  {
    type: "rose",
    title: "Rose",
    description: "Classic layered blooms with a romantic shape.",
  },
  {
    type: "tulip",
    title: "Tulip",
    description: "Clean spring petals with a simple cup shape.",
  },
  {
    type: "sunflower",
    title: "Sunflower",
    description: "Large sunny blooms with warm golden petals.",
  },
  {
    type: "daisy",
    title: "Daisy",
    description: "Small bright flowers with crisp white petals.",
  },
  {
    type: "lavender",
    title: "Lavender",
    description: "Slim purple stems for a soft fragrant accent.",
  },
  {
    type: "peony",
    title: "Peony",
    description: "Full rounded blooms with a lush garden feel.",
  },
  {
    type: "babys-breath",
    title: "Baby's Breath",
    description: "Tiny white filler flowers for volume and softness.",
  },
  {
    type: "hydrangea",
    title: "Hydrangea",
    description: "Large clustered flowers with a cool blue tone.",
  },
  {
    type: "carnation",
    title: "Carnation",
    description: "Ruffled medium blooms with strong color.",
  },
  {
    type: "lily",
    title: "Lily",
    description: "Elegant open petals for a taller focal flower.",
  },
  {
    type: "iris",
    title: "Iris",
    description: "Sculptural purple blooms with a refined shape.",
  },
  {
    type: "chrysanthemum",
    title: "Chrysanthemum",
    description: "Dense bright petals for cheerful texture.",
  },
];

const flowerTypeVariations: FlowerTypeVariation[] = [
  {
    id: "rose-tulip-daisy",
    title: "Rose, Tulip, Daisy",
    description: "Two roses, three tulips, and four daisies.",
    flowers: [
      { type: "rose", quantity: 2 },
      { type: "tulip", quantity: 3 },
      { type: "daisy", quantity: 4 },
    ],
  },
  {
    id: "sunny-field",
    title: "Sunny Field",
    description: "Three sunflowers, six lavender stems, and five baby's breath stems.",
    flowers: [
      { type: "sunflower", quantity: 3 },
      { type: "lavender", quantity: 6 },
      { type: "babys-breath", quantity: 5 },
    ],
  },
  {
    id: "garden-luxe",
    title: "Garden Luxe",
    description: "Two peonies, two lilies, three carnations, and one hydrangea.",
    flowers: [
      { type: "peony", quantity: 2 },
      { type: "lily", quantity: 2 },
      { type: "carnation", quantity: 3 },
      { type: "hydrangea", quantity: 1 },
    ],
  },
];

const flowerPresetByType = {
  rose: FLOWER_PRESETS.redRose,
  tulip: FLOWER_PRESETS.pinkTulip,
  sunflower: FLOWER_PRESETS.sunflower,
  daisy: FLOWER_PRESETS.daisy,
  lavender: FLOWER_PRESETS.lavender,
  peony: FLOWER_PRESETS.peony,
  "babys-breath": FLOWER_PRESETS.babysBreath,
  hydrangea: FLOWER_PRESETS.hydrangea,
  carnation: FLOWER_PRESETS.carnationRed,
  lily: FLOWER_PRESETS.lily,
  iris: FLOWER_PRESETS.iris,
  chrysanthemum: FLOWER_PRESETS.chrysanthemum,
} satisfies Record<FlowerType, Flower>;

function cloneBouquetEntry(entry: { type: FlowerType; count: number }): { type: FlowerType; count: number } {
  return { ...entry };
}

function cloneCard(card: FlowerCard): FlowerCard {
  return {
    content: { ...card.content },
    bouquet: {
      flowers: card.bouquet.flowers.map(cloneBouquetEntry),
    },
    background: card.background,
  };
}

export function createFlowerOfType(
  type: FlowerType,
  quantity = 1,
): Flower {
  return {
    ...flowerPresetByType[type],
    quantity,
  };
}

export function getPresetChoiceProposals(card: FlowerCard): FlowerCardProposal[] {
  return [
    {
      id: "classic-roses",
      title: "Classic Roses",
      description: "A warm message with red roses and baby's breath.",
      card: {
        ...cloneCard(card),
        content: {
          htmlContent:
            "<h2>Happy Mother's Day, Mom!</h2><p>Thank you for every kind word, every bit of patience, and every day you made brighter.</p>",
        },
        bouquet: {
          flowers: [
            { type: FLOWER_PRESETS.redRose.type, count: 7 },
            { type: FLOWER_PRESETS.babysBreath.type, count: 12 },
          ],
        },
        background: "blush",
      },
    },
    {
      id: "spring-garden",
      title: "Spring Garden",
      description: "Tulips, peonies, and daisies with a cheerful note.",
      card: {
        ...cloneCard(card),
        content: {
          htmlContent:
            "<h2>For The Best Mom</h2><p>You bring color, care, and joy into every season.</p>",
        },
        bouquet: {
          flowers: [
            { type: FLOWER_PRESETS.pinkTulip.type, count: 5 },
            { type: FLOWER_PRESETS.peony.type, count: 3 },
            { type: FLOWER_PRESETS.daisy.type, count: 6 },
          ],
        },
        background: "sage",
      },
    },
    {
      id: "sunny-thanks",
      title: "Sunny Thanks",
      description: "Sunflowers and lavender with a bright thank-you message.",
      card: {
        ...cloneCard(card),
        content: {
          htmlContent:
            "<h2>Thank You, Mom</h2><p>Your love is steady, generous, and full of light.</p>",
        },
        bouquet: {
          flowers: [
            { type: FLOWER_PRESETS.sunflower.type, count: 3 },
            { type: FLOWER_PRESETS.lavender.type, count: 6 },
            { type: FLOWER_PRESETS.yellowTulip.type, count: 4 },
          ],
        },
        background: "buttercream",
      },
    },
  ];
}

export function getBackgroundProposals(card: FlowerCard): FlowerCardProposal[] {
  return ALL_BACKGROUND_PRESETS.map((preset) => {
    const spec = BACKGROUND_PRESETS[preset];
    return {
      id: `bg-${preset}`,
      title: spec.title,
      description: spec.description,
      card: {
        ...cloneCard(card),
        background: preset,
      },
    };
  });
}

export const ALL_BACKGROUND_PRESET_IDS: BackgroundPreset[] =
  ALL_BACKGROUND_PRESETS;

export function getPresetCardProposals(card: FlowerCard): FlowerCardProposal[] {
  return [
    {
      id: "short-and-sweet",
      title: "Short And Sweet",
      description: "A concise Mother's Day note.",
      card: {
        ...cloneCard(card),
        content: {
          htmlContent:
            "<h2>Happy Mother's Day</h2><p>I love you and appreciate everything you do.</p>",
        },
      },
    },
    {
      id: "heartfelt-thanks",
      title: "Heartfelt Thanks",
      description: "A fuller thank-you message.",
      card: {
        ...cloneCard(card),
        content: {
          htmlContent:
            "<h2>With All My Love</h2><p>Thank you for showing up, listening closely, and making ordinary days feel cared for.</p>",
        },
      },
    },
    {
      id: "admiration",
      title: "Admiration",
      description: "A message centered on respect and gratitude.",
      card: {
        ...cloneCard(card),
        content: {
          htmlContent:
            "<h2>You Inspire Me</h2><p>Your strength, humor, and kindness have shaped me more than I can say.</p>",
        },
      },
    },
  ];
}

export function getFlowerTypeVariationProposals(
  card: FlowerCard,
): FlowerCardProposal[] {
  return flowerTypeVariations.map((variation) => ({
    id: variation.id,
    title: variation.title,
    description: variation.description,
    card: {
      ...cloneCard(card),
      bouquet: {
        flowers: variation.flowers.map(({ type, quantity }) => ({
          type,
          count: quantity,
        })),
      },
    },
  }));
}
