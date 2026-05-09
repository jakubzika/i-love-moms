"use client";

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
  return (
    <FlowerProposalPicker
      title="Preset Choices"
      description="Choose a complete card preset with predefined content and bouquet."
      proposals={getPresetChoiceProposals()}
      status={status}
      respond={respond}
    />
  );
}

