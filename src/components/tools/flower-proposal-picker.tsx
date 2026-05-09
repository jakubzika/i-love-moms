"use client";

import { useFlowerCard } from "@/context/flower-card-context";
import { useEffect, useId, useRef, useState } from "react";
import type {
  FlowerCardProposal,
  FlowerToolResponse,
  FlowerToolStatus,
} from "./flower-tool-types";
import { ToolItem } from "./tool-item";
import { useToolConfirmation } from "./tool-confirmation";

type FlowerProposalPickerProps = {
  title: string;
  description: string;
  proposals: FlowerCardProposal[];
  status: FlowerToolStatus;
  respond?: FlowerToolResponse;
};

export function FlowerProposalPicker({
  title,
  description,
  proposals,
  status,
  respond,
}: FlowerProposalPickerProps) {
  const {
    activePreviewSessionId,
    beginPreviewSession,
    clearPreviewSession,
    previewCardForSession,
    setState,
  } = useFlowerCard();
  const sessionId = useId();
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(
    null,
  );
  const finishedRef = useRef(false);
  const selectedProposal =
    proposals.find((proposal) => proposal.id === selectedProposalId) ?? null;
  const isActiveSession = activePreviewSessionId === sessionId;
  const canRespond = status === "executing" && isActiveSession;
  const confirmationSummary = selectedProposal
    ? selectedProposal.title
    : "Choose an option to preview.";

  useToolConfirmation(
    canRespond
      ? {
          id: sessionId,
          title,
          summary: confirmationSummary,
          canAccept: Boolean(selectedProposal),
          onAccept: acceptProposal,
          onReject: rejectProposal,
        }
      : null,
  );

  useEffect(() => {
    beginPreviewSession(sessionId);

    return () => {
      if (!finishedRef.current) {
        clearPreviewSession(sessionId);
      }
    };
  }, [beginPreviewSession, clearPreviewSession, sessionId]);

  function selectProposal(proposal: FlowerCardProposal) {
    if (!isActiveSession) {
      return;
    }

    setSelectedProposalId(proposal.id);
    previewCardForSession(sessionId, proposal.card);
  }

  async function acceptProposal() {
    if (!selectedProposal) {
      console.log("[picker] acceptProposal: no selectedProposal, bailing");
      return;
    }

    console.log("[picker] acceptProposal START", {
      title,
      id: selectedProposal.id,
      bg: selectedProposal.card.background,
    });
    finishedRef.current = true;
    setState(selectedProposal.card);
    console.log("[picker] acceptProposal: setState done, awaiting respond");
    await respond?.(`accepted:${selectedProposal.id}`);
    console.log("[picker] acceptProposal: respond done, clearing preview");
    clearPreviewSession(sessionId);
    console.log("[picker] acceptProposal END");
  }

  async function rejectProposal() {
    console.log("[picker] rejectProposal", { title });
    finishedRef.current = true;
    await respond?.("rejected");
    clearPreviewSession(sessionId);
  }

  return (
    <ToolItem title={title} description={description}>
      <div className="grid gap-2">
        {proposals.map((proposal) => {
          const isSelected = selectedProposalId === proposal.id;

          return (
            <button
              key={proposal.id}
              type="button"
              onClick={() => selectProposal(proposal)}
              className={[
                "rounded-md border p-3 text-left transition",
                isSelected
                  ? "border-neutral-950 bg-neutral-950 text-white"
                  : "border-neutral-200 bg-white text-neutral-950 hover:bg-neutral-50",
              ].join(" ")}
            >
              <span className="block text-sm font-medium">
                {proposal.title}
              </span>
              {proposal.description ? (
                <span
                  className={[
                    "mt-1 block text-xs",
                    isSelected ? "text-neutral-200" : "text-neutral-500",
                  ].join(" ")}
                >
                  {proposal.description}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </ToolItem>
  );
}
