"use client";

import type { ReactNode } from "react";
import { ToolConfirmationBar } from "./tool-confirmation";

type ToolItemProps = {
  title: string;
  description: ReactNode;
  children: ReactNode;
};

export function ToolItem({ title, description, children }: ToolItemProps) {
  return (
    <div className="my-4 w-full max-w-xl rounded-lg border bg-white p-4 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-neutral-950">{title}</h3>
        <p className="mt-1 text-sm text-neutral-600">{description}</p>
      </div>

      {children}

      <div className="mt-4">
        <ToolConfirmationBar />
      </div>
    </div>
  );
}
