"use client";

import { useFlowerCard } from "@/context/flower-card-context";
import { useMemo } from "react";
import { FlowerProposalPicker } from "./flower-proposal-picker";
import { getPresetChoiceProposals } from "./flower-tool-presets";
import type { FlowerToolResponse, FlowerToolStatus } from "./flower-tool-types";

type PresetChoicesToolProps = {
  status: FlowerToolStatus;
  respond?: FlowerToolResponse;
};

export function PresetChoicesTool({
  status,
  respond,
}: PresetChoicesToolProps) {
  const { state } = useFlowerCard();
  const proposals = useMemo(() => getPresetChoiceProposals(state), [state]);

  return (
    <FlowerProposalPicker
      title="Preset Choices"
      description="Choose a complete card preset with predefined content and bouquet."
      proposals={proposals}
      status={status}
      respond={respond}
    />
  );
}

