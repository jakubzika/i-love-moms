"use client";

import { useFlowerCard } from "@/context/flower-card-context";
import { useMemo } from "react";
import { FlowerProposalPicker } from "./flower-proposal-picker";
import { getPresetCardProposals } from "./flower-tool-presets";
import type { FlowerToolResponse, FlowerToolStatus } from "./flower-tool-types";

type PresetCardsToolProps = {
  status: FlowerToolStatus;
  respond?: FlowerToolResponse;
};

export function PresetCardsTool({ status, respond }: PresetCardsToolProps) {
  const { state } = useFlowerCard();
  const proposals = useMemo(() => getPresetCardProposals(state), [state]);

  return (
    <FlowerProposalPicker
      title="Preset Cards"
      description="Choose a content preset while keeping the current bouquet."
      proposals={proposals}
      status={status}
      respond={respond}
    />
  );
}

