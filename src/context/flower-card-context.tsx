"use client";

import { FLOWER_PRESETS } from "@/flowers/flower";
import type { FlowerCard } from "@/flowers/schema";
import { useCoAgent } from "@copilotkit/react-core";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

const initialFlowerCard: FlowerCard = {
  content: {
    htmlContent:
      '<div class="theme-romantic-serif"><h1 class="card-title">Happy Mother\'s Day</h1><p class="card-content">Thank you for everything, Mom &mdash; today and every day.</p></div>',
  },
  bouquet: {
    flowers: [
      { type: FLOWER_PRESETS.redRose.type, count: 7 },
      { type: FLOWER_PRESETS.babysBreath.type, count: 12 },
    ],
  },
  background: "ivory",
};

type FlowerCardContextValue = {
  state: FlowerCard;
  setState: (card: FlowerCard) => void;
  previewCard: FlowerCard | null;
  setPreviewCard: (card: FlowerCard | null) => void;
  activePreviewSessionId: string | null;
  beginPreviewSession: (sessionId: string) => void;
  previewCardForSession: (sessionId: string, card: FlowerCard) => void;
  clearPreviewSession: (sessionId: string) => void;
  displayCard: FlowerCard;
};

const FlowerCardContext = createContext<FlowerCardContextValue | null>(null);

export function FlowerCardProvider({ children }: { children: ReactNode }) {
  const { state: agentState, setState: setAgentState } = useCoAgent<FlowerCard>({
    name: "weatherAgent",
    initialState: initialFlowerCard,
  });
  const [localCard, setLocalCard] = useState<FlowerCard | null>(null);
  const [previewState, setPreviewState] = useState<{
    activePreviewSessionId: string | null;
    card: FlowerCard | null;
  }>({
    activePreviewSessionId: null,
    card: null,
  });

  // Once the user commits a card via setState, localCard is authoritative.
  // The agent's state can drift (or reset on a failed run) without affecting
  // what the user sees. A future agent-driven update should call setState.

  const committedState = localCard ?? agentState ?? initialFlowerCard;
  const setState = useCallback(
    (card: FlowerCard) => {
      setLocalCard(card);
      setAgentState(card);
    },
    [setAgentState],
  );
  const setPreviewCard = useCallback((card: FlowerCard | null) => {
    setPreviewState((current) => ({
      ...current,
      card,
    }));
  }, []);
  const beginPreviewSession = useCallback((sessionId: string) => {
    console.log("[ctx] beginPreviewSession", { sessionId });
    setPreviewState({
      activePreviewSessionId: sessionId,
      card: null,
    });
  }, []);
  const previewCardForSession = useCallback(
    (sessionId: string, card: FlowerCard) => {
      setPreviewState((current) => {
        const matches = current.activePreviewSessionId === sessionId;
        console.log("[ctx] previewCardForSession", {
          sessionId,
          activePreviewSessionId: current.activePreviewSessionId,
          matches,
          bg: card.background,
        });
        if (!matches) {
          return current;
        }

        return {
          ...current,
          card,
        };
      });
    },
    [],
  );
  const clearPreviewSession = useCallback((sessionId: string) => {
    setPreviewState((current) => {
      const matches = current.activePreviewSessionId === sessionId;
      console.log("[ctx] clearPreviewSession", { sessionId, matches });
      if (!matches) {
        return current;
      }

      return {
        activePreviewSessionId: null,
        card: null,
      };
    });
  }, []);

  const value = useMemo(
    () => ({
      state: committedState,
      setState,
      previewCard: previewState.card,
      setPreviewCard,
      activePreviewSessionId: previewState.activePreviewSessionId,
      beginPreviewSession,
      previewCardForSession,
      clearPreviewSession,
      displayCard: previewState.card ?? committedState,
    }),
    [
      beginPreviewSession,
      clearPreviewSession,
      committedState,
      previewCardForSession,
      previewState.activePreviewSessionId,
      previewState.card,
      setPreviewCard,
      setState,
    ],
  );

  return (
    <FlowerCardContext.Provider value={value}>
      {children}
    </FlowerCardContext.Provider>
  );
}

export function useFlowerCard() {
  const context = useContext(FlowerCardContext);

  if (!context) {
    throw new Error("useFlowerCard must be used within a FlowerCardProvider");
  }

  return context;
}
