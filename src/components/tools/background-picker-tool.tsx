"use client";

import { useFlowerCard } from "@/context/flower-card-context";
import { useMemo } from "react";
import { FlowerProposalPicker } from "./flower-proposal-picker";
import { getBackgroundProposals } from "./flower-tool-presets";
import type { FlowerToolResponse, FlowerToolStatus } from "./flower-tool-types";

type BackgroundPickerToolProps = {
  status: FlowerToolStatus;
  respond?: FlowerToolResponse;
};

export function BackgroundPickerTool({
  status,
  respond,
}: BackgroundPickerToolProps) {
  const { state } = useFlowerCard();
  const proposals = useMemo(() => getBackgroundProposals(state), [state]);

  return (
    <FlowerProposalPicker
      title="Background"
      description="Pick a background color for the card."
      proposals={proposals}
      status={status}
      respond={respond}
    />
  );
}
