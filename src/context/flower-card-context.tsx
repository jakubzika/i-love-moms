"use client";

import { FLOWER_PRESETS, type FlowerCard } from "@/flowers/schema";
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
      "<h2>Happy Mother's Day, Mom!</h2><p>Thanks for everything.</p>",
  },
  bouquet: {
    flowers: [
      { ...FLOWER_PRESETS.redRose, quantity: 7 },
      { ...FLOWER_PRESETS.babysBreath, quantity: 12 },
    ],
  },
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
  const { state, setState } = useCoAgent<FlowerCard>({
    name: "weatherAgent",
    initialState: initialFlowerCard,
  });
  const [previewState, setPreviewState] = useState<{
    activePreviewSessionId: string | null;
    card: FlowerCard | null;
  }>({
    activePreviewSessionId: null,
    card: null,
  });

  const committedState = state ?? initialFlowerCard;
  const setPreviewCard = useCallback((card: FlowerCard | null) => {
    setPreviewState((current) => ({
      ...current,
      card,
    }));
  }, []);
  const beginPreviewSession = useCallback((sessionId: string) => {
    setPreviewState({
      activePreviewSessionId: sessionId,
      card: null,
    });
  }, []);
  const previewCardForSession = useCallback(
    (sessionId: string, card: FlowerCard) => {
      setPreviewState((current) => {
        if (current.activePreviewSessionId !== sessionId) {
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
      if (current.activePreviewSessionId !== sessionId) {
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
