"use client";

import { useState } from "react";
import { FlowerCardPreview } from "./index";
import {
  ALL_FLOWER_TYPES,
  type BouquetEntry,
  type FlowerCard,
  type FlowerType,
} from "./schema";

const initialCounts: Record<FlowerType, number> = {
  rose: 7,
  tulip: 0,
  sunflower: 0,
  daisy: 0,
  lavender: 0,
  peony: 0,
  "babys-breath": 12,
  hydrangea: 0,
  carnation: 0,
  lily: 0,
  iris: 0,
  chrysanthemum: 0,
};

const initialHtml =
  "<h2>Happy Mother's Day, Mom! 🌹</h2><p>Thanks for everything.</p>";

export default function FlowerCardForm() {
  const [counts, setCounts] =
    useState<Record<FlowerType, number>>(initialCounts);
  const [htmlContent, setHtmlContent] = useState(initialHtml);

  const flowers: BouquetEntry[] = ALL_FLOWER_TYPES.flatMap((type) => {
    const count = counts[type];
    return count > 0 ? [{ type, count }] : [];
  });

  const card: FlowerCard = {
    content: { htmlContent },
    bouquet: { flowers },
  };

  const setCount = (type: FlowerType, value: number) => {
    setCounts((c) => ({ ...c, [type]: Math.max(0, Math.floor(value)) }));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 min-h-screen">
      <div className="flex items-center justify-center p-6">
        <FlowerCardPreview card={card} />
      </div>
      <aside className="border-l p-6 overflow-auto bg-muted/30 space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-mono opacity-70 block">message</label>
          <textarea
            value={htmlContent}
            onChange={(e) => setHtmlContent(e.target.value)}
            rows={3}
            className="w-full font-mono text-xs p-2 border rounded bg-white"
          />
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-mono opacity-70">flowers</h2>
          <div className="space-y-1.5">
            {ALL_FLOWER_TYPES.map((type) => (
              <div
                key={type}
                className="flex items-center gap-2 font-mono text-xs"
              >
                <label className="flex-1 truncate">{type}</label>
                <button
                  type="button"
                  onClick={() => setCount(type, counts[type] - 1)}
                  className="w-6 h-6 rounded border bg-white hover:bg-muted disabled:opacity-30"
                  disabled={counts[type] <= 0}
                >
                  −
                </button>
                <input
                  type="number"
                  min={0}
                  value={counts[type]}
                  onChange={(e) => setCount(type, Number(e.target.value))}
                  className="w-12 text-center border rounded bg-white p-1"
                />
                <button
                  type="button"
                  onClick={() => setCount(type, counts[type] + 1)}
                  className="w-6 h-6 rounded border bg-white hover:bg-muted"
                >
                  +
                </button>
              </div>
            ))}
          </div>
        </div>

        <details className="font-mono text-xs opacity-60">
          <summary className="cursor-pointer">card json</summary>
          <pre className="mt-2 whitespace-pre-wrap wrap-break-word">
            {JSON.stringify(card, null, 2)}
          </pre>
        </details>
      </aside>
    </div>
  );
}
