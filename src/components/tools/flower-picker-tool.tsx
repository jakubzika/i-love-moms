"use client";

import { useFlowerCard } from "@/context/flower-card-context";
import type { FlowerCard, FlowerType } from "@/flowers/schema";
import { Minus, Plus } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  createFlowerOfType,
  flowerTypeOptions,
} from "./flower-tool-presets";
import type { FlowerToolResponse, FlowerToolStatus } from "./flower-tool-types";
import { ToolItem } from "./tool-item";
import { useToolConfirmation } from "./tool-confirmation";

type FlowerPickerToolProps = {
  status: FlowerToolStatus;
  respond?: FlowerToolResponse;
};

type FlowerTypeCounts = Record<FlowerType, number>;

function createEmptyTypeCounts(): FlowerTypeCounts {
  return flowerTypeOptions.reduce((counts, option) => {
    counts[option.type] = 0;
    return counts;
  }, {} as FlowerTypeCounts);
}

export function FlowerPickerTool({ status, respond }: FlowerPickerToolProps) {
  const {
    activePreviewSessionId,
    beginPreviewSession,
    clearPreviewSession,
    previewCardForSession,
    setState,
    state,
  } = useFlowerCard();
  const sessionId = useId();
  const hasExistingFlowers = state.bouquet.flowers.length > 0;
  const [selectedTypes, setSelectedTypes] = useState<FlowerType[]>(() =>
    state.bouquet.flowers.map((flower) => flower.type),
  );
  const [typeCounts, setTypeCounts] = useState<FlowerTypeCounts>(
    createEmptyTypeCounts,
  );
  const finishedRef = useRef(false);
  const isActiveSession = activePreviewSessionId === sessionId;
  const canRespond = status === "executing" && isActiveSession;
  const selectedCard = useMemo(
    () =>
      hasExistingFlowers
        ? createCardFromSelectedTypes(state, selectedTypes)
        : createCardFromTypeCounts(state, typeCounts),
    [hasExistingFlowers, selectedTypes, state, typeCounts],
  );
  const selectedTypeList = selectedCard.bouquet.flowers.flatMap((flower) =>
    Array.from({ length: flower.count }, () => flower.type),
  );
  const responseTypeList = hasExistingFlowers
    ? selectedCard.bouquet.flowers.map((flower) => flower.type)
    : selectedTypeList;
  const canAccept = responseTypeList.length > 0;
  const confirmationSummary =
    selectedTypeList.length > 0
      ? `${selectedTypeList.length} stem${selectedTypeList.length === 1 ? "" : "s"} in preview.`
      : "Add at least one flower to preview.";

  useToolConfirmation(
    canRespond
      ? {
          id: sessionId,
          title: "Flower Picker",
          summary: confirmationSummary,
          canAccept,
          onAccept: acceptSelection,
          onReject: rejectSelection,
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

  useEffect(() => {
    if (isActiveSession) {
      previewCardForSession(sessionId, selectedCard);
    }
  }, [isActiveSession, previewCardForSession, selectedCard, sessionId]);

  function updateSelectedType(index: number, type: FlowerType) {
    setSelectedTypes((current) =>
      current.map((currentType, currentIndex) =>
        currentIndex === index ? type : currentType,
      ),
    );
  }

  function updateTypeCount(type: FlowerType, delta: number) {
    setTypeCounts((current) => ({
      ...current,
      [type]: Math.max(0, current[type] + delta),
    }));
  }

  async function acceptSelection() {
    if (!canAccept) {
      return;
    }

    finishedRef.current = true;
    setState(selectedCard);
    await respond?.(`accepted:${JSON.stringify(responseTypeList)}`);
    clearPreviewSession(sessionId);
  }

  async function rejectSelection() {
    finishedRef.current = true;
    await respond?.("rejected");
    clearPreviewSession(sessionId);
  }

  return (
    <ToolItem
      title="Flower Picker"
      description={
        hasExistingFlowers
          ? "Choose the flower type for each bouquet entry."
          : "Build a bouquet by setting the count for each flower type."
      }
    >
      {hasExistingFlowers ? (
        <div className="grid gap-3">
          {state.bouquet.flowers.map((flower, index) => (
            <label
              key={`${flower.type}-${index}`}
              className="grid gap-1 rounded-md border border-neutral-200 p-3"
            >
              <span className="text-xs font-medium uppercase text-neutral-500">
                Flower {index + 1}
                {flower.count > 1 ? ` (${flower.count} stems)` : ""}
              </span>
              <select
                value={selectedTypes[index] ?? flower.type}
                onChange={(event) =>
                  updateSelectedType(index, event.target.value as FlowerType)
                }
                className="h-10 rounded-md border border-neutral-300 bg-white px-3 text-sm text-neutral-950 outline-none focus:border-neutral-950"
              >
                {flowerTypeOptions.map((option) => (
                  <option key={option.type} value={option.type}>
                    {option.title}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      ) : (
        <div className="grid gap-2">
          {flowerTypeOptions.map((option) => (
            <div
              key={option.type}
              className="flex items-center justify-between gap-3 rounded-md border border-neutral-200 p-3"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium text-neutral-950">
                  {option.title}
                </div>
                <div className="mt-1 text-xs text-neutral-500">
                  {option.description}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateTypeCount(option.type, -1)}
                  disabled={typeCounts[option.type] === 0}
                  className="size-8 rounded-md border border-neutral-300 text-sm font-medium text-neutral-950 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label={`Remove ${option.title}`}
                >
                  <Minus className="mx-auto size-4" aria-hidden="true" />
                </button>
                <span className="w-6 text-center text-sm font-medium text-neutral-950">
                  {typeCounts[option.type]}
                </span>
                <button
                  type="button"
                  onClick={() => updateTypeCount(option.type, 1)}
                  className="size-8 rounded-md bg-neutral-950 text-sm font-medium text-white"
                  aria-label={`Add ${option.title}`}
                >
                  <Plus className="mx-auto size-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </ToolItem>
  );
}

function createCardFromSelectedTypes(
  card: FlowerCard,
  selectedTypes: FlowerType[],
): FlowerCard {
  return {
    ...card,
    bouquet: {
      flowers: card.bouquet.flowers.map((flower, index) => {
        const type = selectedTypes[index] ?? flower.type;
        return { type, count: flower.count };
      }),
    },
  };
}

function createCardFromTypeCounts(
  card: FlowerCard,
  typeCounts: FlowerTypeCounts,
): FlowerCard {
  return {
    ...card,
    bouquet: {
      flowers: flowerTypeOptions
        .filter((option) => typeCounts[option.type] > 0)
        .map((option) => ({
          type: option.type,
          count: typeCounts[option.type],
        })),
    },
  };
}
