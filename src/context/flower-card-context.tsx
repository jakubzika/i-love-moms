"use client";

import { FLOWER_PRESETS } from "@/flowers/flower";
import type { FlowerCard } from "@/flowers/schema";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

const initialFlowerCard: FlowerCard = {
  content: {
    title: "Happy Mother's Day",
    body: "Thank you for everything, Mom — today and every day.",
    signature: "— with all my love",
    fontPairing: "serif-classic",
  },
  bouquet: {
    flowers: [
      { type: FLOWER_PRESETS.redRose.type, count: 7 },
      { type: FLOWER_PRESETS.babysBreath.type, count: 12 },
    ],
  },
  background: "blush",
};

type FlowerCardContextValue = {
  state: FlowerCard;
  setState: (card: FlowerCard) => void;
  getCard: () => FlowerCard;
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
  const [card, setCard] = useState<FlowerCard>(initialFlowerCard);
  const cardRef = useRef(card);
  cardRef.current = card;

  const [previewState, setPreviewState] = useState<{
    activePreviewSessionId: string | null;
    card: FlowerCard | null;
  }>({
    activePreviewSessionId: null,
    card: null,
  });

  const setState = useCallback((next: FlowerCard) => {
    setCard(next);
  }, []);

  const getCard = useCallback(() => cardRef.current, []);

  const setPreviewCard = useCallback((next: FlowerCard | null) => {
    setPreviewState((current) => ({ ...current, card: next }));
  }, []);

  const beginPreviewSession = useCallback((sessionId: string) => {
    setPreviewState({ activePreviewSessionId: sessionId, card: null });
  }, []);

  const previewCardForSession = useCallback(
    (sessionId: string, next: FlowerCard) => {
      setPreviewState((current) => {
        if (current.activePreviewSessionId !== sessionId) return current;
        return { ...current, card: next };
      });
    },
    [],
  );

  const clearPreviewSession = useCallback((sessionId: string) => {
    setPreviewState((current) => {
      if (current.activePreviewSessionId !== sessionId) return current;
      return { activePreviewSessionId: null, card: null };
    });
  }, []);

  const value = useMemo(
    () => ({
      state: card,
      setState,
      getCard,
      previewCard: previewState.card,
      setPreviewCard,
      activePreviewSessionId: previewState.activePreviewSessionId,
      beginPreviewSession,
      previewCardForSession,
      clearPreviewSession,
      displayCard: previewState.card ?? card,
    }),
    [
      beginPreviewSession,
      card,
      clearPreviewSession,
      getCard,
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
