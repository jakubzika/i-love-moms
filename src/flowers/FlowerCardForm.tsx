"use client";

import { FlowerCardPreview } from "./index";
import type { FlowerCard } from "./schema";

const dummyCard: FlowerCard = {
  content: {
    htmlContent:
      "<h2>Happy Mother's Day, Mom! 🌹</h2><p>Thanks for everything.</p>",
  },
  bouquet: {
    flowers: [
      { type: "rose", count: 7 },
      { type: "babys-breath", count: 12 },
    ],
  },
};

export default function FlowerCardForm() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 min-h-screen">
      <div className="flex items-center justify-center p-6">
        <FlowerCardPreview card={dummyCard} />
      </div>
      <aside className="border-l p-6 overflow-auto bg-muted/30">
        <h2 className="text-sm font-mono mb-2 opacity-70">card</h2>
        <pre className="font-mono text-xs whitespace-pre-wrap wrap-break-word">
          {JSON.stringify(dummyCard, null, 2)}
        </pre>
      </aside>
    </div>
  );
}
