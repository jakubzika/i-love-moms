"use client";

import { Button } from "@/components/ui/button";
import { Check, RotateCcw } from "lucide-react";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type ToolConfirmationRegistration = {
  id: string;
  title: string;
  summary: string;
  canAccept: boolean;
  acceptLabel?: string;
  rejectLabel?: string;
  onAccept: () => void | Promise<void>;
  onReject: () => void | Promise<void>;
};

type RegisteredToolConfirmation = ToolConfirmationRegistration;

type ToolConfirmationContextValue = {
  confirmation: RegisteredToolConfirmation | null;
  registerConfirmation: (confirmation: RegisteredToolConfirmation) => void;
  clearConfirmation: (id: string) => void;
};

const ToolConfirmationContext =
  createContext<ToolConfirmationContextValue | null>(null);

export function ToolConfirmationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [confirmation, setConfirmation] =
    useState<RegisteredToolConfirmation | null>(null);

  const registerConfirmation = useCallback(
    (nextConfirmation: RegisteredToolConfirmation) => {
      setConfirmation(nextConfirmation);
    },
    [],
  );

  const clearConfirmation = useCallback((id: string) => {
    setConfirmation((currentConfirmation) =>
      currentConfirmation?.id === id ? null : currentConfirmation,
    );
  }, []);

  const value = useMemo(
    () => ({
      confirmation,
      registerConfirmation,
      clearConfirmation,
    }),
    [clearConfirmation, confirmation, registerConfirmation],
  );

  return (
    <ToolConfirmationContext.Provider value={value}>
      {children}
    </ToolConfirmationContext.Provider>
  );
}

export function useToolConfirmation(
  registration: ToolConfirmationRegistration | null,
) {
  const { clearConfirmation, registerConfirmation } =
    useRequiredToolConfirmationContext();
  const registrationRef = useRef<ToolConfirmationRegistration | null>(null);

  if (registration) {
    registrationRef.current = registration;
  }

  const id = registration?.id ?? null;
  const title = registration?.title ?? "";
  const summary = registration?.summary ?? "";
  const canAccept = registration?.canAccept ?? false;
  const acceptLabel = registration?.acceptLabel ?? "Keep";
  const rejectLabel = registration?.rejectLabel ?? "Undo";

  useEffect(() => {
    if (!id) {
      return;
    }

    registerConfirmation({
      id,
      title,
      summary,
      canAccept,
      acceptLabel,
      rejectLabel,
      onAccept: () => registrationRef.current?.onAccept(),
      onReject: () => registrationRef.current?.onReject(),
    });

    return () => {
      clearConfirmation(id);
    };
  }, [
    acceptLabel,
    canAccept,
    clearConfirmation,
    id,
    registerConfirmation,
    rejectLabel,
    summary,
    title,
  ]);
}

export function ToolConfirmationBar() {
  const { clearConfirmation, confirmation } =
    useRequiredToolConfirmationContext();
  const [isResolving, setIsResolving] = useState(false);

  if (!confirmation) {
    return null;
  }

  async function resolveConfirmation(kind: "accept" | "reject") {
    if (!confirmation || isResolving) {
      return;
    }

    setIsResolving(true);

    try {
      if (kind === "accept") {
        await confirmation.onAccept();
      } else {
        await confirmation.onReject();
      }
    } finally {
      clearConfirmation(confirmation.id);
      setIsResolving(false);
    }
  }

  return (
    <div className="sticky bottom-0 z-20 mb-2 flex min-h-12 items-center gap-3 rounded-md border border-neutral-200 bg-white/95 px-3 py-2 shadow-sm backdrop-blur">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-neutral-950">
          {confirmation.title}
        </p>
        <p className="truncate text-xs text-neutral-500">
          {confirmation.summary}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button
          type="button"
          size="sm"
          onClick={() => void resolveConfirmation("accept")}
          disabled={!confirmation.canAccept || isResolving}
        >
          <Check data-icon="inline-start" className="size-3.5" />
          {confirmation.acceptLabel ?? "Keep"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => void resolveConfirmation("reject")}
          disabled={isResolving}
        >
          <RotateCcw data-icon="inline-start" className="size-3.5" />
          {confirmation.rejectLabel ?? "Undo"}
        </Button>
      </div>
    </div>
  );
}

export function useHasActiveToolConfirmation() {
  const { confirmation } = useRequiredToolConfirmationContext();

  return Boolean(confirmation);
}

function useRequiredToolConfirmationContext() {
  const context = useContext(ToolConfirmationContext);

  if (!context) {
    throw new Error(
      "Tool confirmation components must be used within ToolConfirmationProvider",
    );
  }

  return context;
}
