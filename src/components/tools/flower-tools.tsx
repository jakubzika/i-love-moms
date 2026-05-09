"use client";

import { useCopilotAction } from "@copilotkit/react-core";
import { FlowerPickerTool } from "./flower-picker-tool";
import { FlowerTypeVariationsTool } from "./flower-type-variations-tool";
import { PresetCardsTool } from "./preset-cards-tool";
import { PresetChoicesTool } from "./preset-choices-tool";
import type { FlowerToolStatus } from "./flower-tool-types";

export function FlowerTools() {
  useCopilotAction({
    name: "preset-choices",
    description:
      "Show complete flower card presets with predefined content and bouquets. Wait for the user to accept or reject one.",
    renderAndWaitForResponse: ({ respond, status }) => (
      <PresetChoicesTool
        status={status as FlowerToolStatus}
        respond={respond}
      />
    ),
  });

  useCopilotAction({
    name: "flower-picker",
    description:
      "Show a flower type picker for the current bouquet. If the bouquet has flowers, let the user choose a flower type for each bouquet entry as an array of flower types. If the bouquet is empty, show counters for each flower type. Wait for the user to accept or reject the selection.",
    renderAndWaitForResponse: ({ respond, status }) => (
      <FlowerPickerTool
        status={status as FlowerToolStatus}
        respond={respond}
      />
    ),
  });

  useCopilotAction({
    name: "preset-cards",
    description:
      "Show preset card content choices while preserving the current bouquet. Wait for the user to accept or reject one.",
    renderAndWaitForResponse: ({ respond, status }) => (
      <PresetCardsTool
        status={status as FlowerToolStatus}
        respond={respond}
      />
    ),
  });

  useCopilotAction({
    name: "flower-type-variations",
    description:
      "Show preset mixed flower type variations for the current card, such as two roses and three tulips. Wait for the user to accept or reject one.",
    renderAndWaitForResponse: ({ respond, status }) => (
      <FlowerTypeVariationsTool
        status={status as FlowerToolStatus}
        respond={respond}
      />
    ),
  });

  return null;
}
