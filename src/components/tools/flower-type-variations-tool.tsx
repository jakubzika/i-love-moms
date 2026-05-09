"use client";

import { useFlowerCard } from "@/context/flower-card-context";
import { useMemo } from "react";
import { FlowerProposalPicker } from "./flower-proposal-picker";
import { getFlowerTypeVariationProposals } from "./flower-tool-presets";
import type { FlowerToolResponse, FlowerToolStatus } from "./flower-tool-types";

type FlowerTypeVariationsToolProps = {
  status: FlowerToolStatus;
  respond?: FlowerToolResponse;
};

export function FlowerTypeVariationsTool({
  status,
  respond,
}: FlowerTypeVariationsToolProps) {
  const { state } = useFlowerCard();
  const proposals = useMemo(
    () => getFlowerTypeVariationProposals(state),
    [state],
  );

  return (
    <FlowerProposalPicker
      title="Flower Type Variations"
      description="Choose a preset distribution of flower types for the bouquet."
      proposals={proposals}
      status={status}
      respond={respond}
    />
  );
}
