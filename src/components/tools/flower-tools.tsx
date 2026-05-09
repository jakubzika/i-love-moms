"use client";

import { useFlowerCard } from "@/context/flower-card-context";
import {
  ALL_BACKGROUND_PRESETS,
  ALL_FLOWER_TYPES,
  ALL_FONT_PAIRINGS,
  type FlowerCard,
} from "@/flowers/schema";
import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";
import { FlowerProposalPicker } from "./flower-proposal-picker";
import type { FlowerCardProposal, FlowerToolStatus } from "./flower-tool-types";

type ProposalArg = {
  id: string;
  title: string;
  description?: string;
  card: FlowerCard;
};

type ProposeArgs = {
  proposals?: ProposalArg[];
};

export function FlowerTools() {
  const { state, setState } = useFlowerCard();

  const readableValue = JSON.stringify(state, null, 2);

  useCopilotReadable({
    description:
      "Current flower card state (always live). NEVER claim the card is empty or missing — read the values from this JSON.",
    value: readableValue,
  });

  useCopilotAction({
    name: "edit-card",
    description: `Apply a partial edit to the card. Pass ONLY the fields you want to change — everything else stays the same.

You can change:
- title (string), body (string), signature (string), fontPairing (one of: ${ALL_FONT_PAIRINGS.join(", ")})
- background (one of: ${ALL_BACKGROUND_PRESETS.join(", ")})
- bouquet operations (add / remove / set per flower type — see below)

You almost never need to send all fields. To change just the title, send only { title: "..." }.

Bouquet ops (each independent):
- addFlowers: list of { type, count } to ADD to the existing bouquet (sums with current count if type already there).
- removeFlowers: list of flower types to REMOVE entirely.
- setFlowerCounts: list of { type, count } to set absolute counts (use count: 0 to remove).

Example — change just the background: { "background": "sage" }
Example — only add lavender: { "addFlowers": [{ "type": "lavender", "count": 10 }] }
Example — remove all roses: { "removeFlowers": ["rose"] }
Example — change only the font: { "fontPairing": "clean" }`,
    parameters: [
      { name: "title", type: "string", required: false },
      { name: "body", type: "string", required: false },
      { name: "signature", type: "string", required: false },
      {
        name: "fontPairing",
        type: "string",
        required: false,
        description: `One of: ${ALL_FONT_PAIRINGS.join(", ")}.`,
      },
      {
        name: "background",
        type: "string",
        required: false,
        description: `One of: ${ALL_BACKGROUND_PRESETS.join(", ")}.`,
      },
      {
        name: "addFlowers",
        type: "object[]",
        required: false,
        description: "Flowers to add (sums with existing count for that type).",
        attributes: [
          { name: "type", type: "string" },
          { name: "count", type: "number" },
        ],
      },
      {
        name: "removeFlowers",
        type: "string[]",
        required: false,
        description: "Flower types to remove from the bouquet.",
      },
      {
        name: "setFlowerCounts",
        type: "object[]",
        required: false,
        description:
          "Set absolute counts for the listed flower types (count: 0 removes).",
        attributes: [
          { name: "type", type: "string" },
          { name: "count", type: "number" },
        ],
      },
    ],
    handler: async (args) => {
      type EditArgs = {
        title?: string;
        body?: string;
        signature?: string;
        fontPairing?: FlowerCard["content"]["fontPairing"];
        background?: FlowerCard["background"];
        addFlowers?: { type: FlowerCard["bouquet"]["flowers"][number]["type"]; count: number }[];
        removeFlowers?: FlowerCard["bouquet"]["flowers"][number]["type"][];
        setFlowerCounts?: { type: FlowerCard["bouquet"]["flowers"][number]["type"]; count: number }[];
      };
      const a = args as EditArgs;

      const validTypes = new Set<string>(ALL_FLOWER_TYPES);
      const isValidType = (t: unknown): t is FlowerCard["bouquet"]["flowers"][number]["type"] =>
        typeof t === "string" && validTypes.has(t);

      const counts = new Map<string, number>();
      for (const f of state.bouquet.flowers) counts.set(f.type, f.count);

      if (a.addFlowers) {
        for (const { type, count } of a.addFlowers) {
          if (!isValidType(type)) continue;
          counts.set(type, (counts.get(type) ?? 0) + count);
        }
      }
      if (a.setFlowerCounts) {
        for (const { type, count } of a.setFlowerCounts) {
          if (!isValidType(type)) continue;
          counts.set(type, count);
        }
      }
      if (a.removeFlowers) {
        for (const type of a.removeFlowers) {
          if (!isValidType(type)) continue;
          counts.delete(type);
        }
      }

      const flowers = Array.from(counts.entries())
        .filter(([type, count]) => count > 0 && isValidType(type))
        .map(([type, count]) => ({
          type: type as FlowerCard["bouquet"]["flowers"][number]["type"],
          count,
        }));

      const next: FlowerCard = {
        content: {
          title: a.title ?? state.content.title,
          body: a.body ?? state.content.body,
          signature: a.signature ?? state.content.signature,
          fontPairing: a.fontPairing ?? state.content.fontPairing,
        },
        bouquet: { flowers },
        background: a.background ?? state.background,
      };
      setState(next);
      return { ok: true, card: next };
    },
  });

  useCopilotAction({
    name: "propose-card-options",
    description: `Show the user 2-4 complete card variants and wait for them to pick one. Each proposal must be a COMPLETE FlowerCard (content with title/body/signature/fontPairing, bouquet, background).

Use when offering choices like style themes, color moods, or message variations.

Font pairings: ${ALL_FONT_PAIRINGS.join(", ")}.
Backgrounds: ${ALL_BACKGROUND_PRESETS.join(", ")}.
Flower types: ${ALL_FLOWER_TYPES.join(", ")}.`,
    parameters: [
      {
        name: "title",
        type: "string",
        required: false,
        description: "Heading shown above the proposal list.",
      },
      {
        name: "description",
        type: "string",
        required: false,
        description: "Subheading shown below the title.",
      },
      {
        name: "proposals",
        type: "object[]",
        required: true,
        attributes: [
          { name: "id", type: "string" },
          { name: "title", type: "string" },
          { name: "description", type: "string", required: false },
          {
            name: "card",
            type: "object",
            attributes: [
              {
                name: "content",
                type: "object",
                attributes: [
                  { name: "title", type: "string" },
                  { name: "body", type: "string" },
                  { name: "signature", type: "string" },
                  { name: "fontPairing", type: "string" },
                ],
              },
              {
                name: "bouquet",
                type: "object",
                attributes: [
                  {
                    name: "flowers",
                    type: "object[]",
                    attributes: [
                      { name: "type", type: "string" },
                      { name: "count", type: "number" },
                    ],
                  },
                ],
              },
              { name: "background", type: "string" },
            ],
          },
        ],
      },
    ],
    renderAndWaitForResponse: ({ args, respond, status }) => {
      const typedArgs = args as ProposeArgs & { title?: string; description?: string };
      const proposals: FlowerCardProposal[] = (typedArgs.proposals ?? []).map(
        (p) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          card: p.card,
        }),
      );

      return (
        <FlowerProposalPicker
          title={typedArgs.title ?? "Choose an option"}
          description={typedArgs.description ?? "Click to preview, then accept."}
          proposals={proposals}
          status={status as FlowerToolStatus}
          respond={respond}
        />
      );
    },
  });

  return null;
}
