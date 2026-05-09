"use client";

import { useState } from "react";
import { BACKGROUND_PRESETS } from "./backgrounds";
import { FlowerCardPreview } from "./index";
import {
  ALL_BACKGROUND_PRESETS,
  ALL_FLOWER_TYPES,
  ALL_FONT_PAIRINGS,
  FONT_PAIRINGS,
  type BackgroundPreset,
  type BouquetEntry,
  type FlowerCard,
  type FlowerType,
  type FontPairing,
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

export default function FlowerCardForm() {
  const [counts, setCounts] =
    useState<Record<FlowerType, number>>(initialCounts);
  const [title, setTitle] = useState("Happy Mother's Day");
  const [body, setBody] = useState(
    "Thank you for the warmth of your kitchen, the patience in your eyes, and the love you've quietly stitched into my life.",
  );
  const [signature, setSignature] = useState("— with all my love");
  const [fontPairing, setFontPairing] = useState<FontPairing>("editorial");
  const [background, setBackground] = useState<BackgroundPreset>("ivory");

  const flowers: BouquetEntry[] = ALL_FLOWER_TYPES.flatMap((type) => {
    const count = counts[type];
    return count > 0 ? [{ type, count }] : [];
  });

  const card: FlowerCard = {
    content: { title, body, signature, fontPairing },
    bouquet: { flowers },
    background,
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
          <label className="text-sm font-mono opacity-70 block">title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full font-mono text-xs p-2 border rounded bg-white"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-mono opacity-70 block">body</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            className="w-full font-mono text-xs p-2 border rounded bg-white"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-mono opacity-70 block">signature</label>
          <input
            type="text"
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            className="w-full font-mono text-xs p-2 border rounded bg-white"
          />
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-mono opacity-70">font pairing</h2>
          <div className="grid grid-cols-1 gap-1.5">
            {ALL_FONT_PAIRINGS.map((id) => {
              const spec = FONT_PAIRINGS[id];
              const isActive = fontPairing === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFontPairing(id)}
                  className={[
                    "rounded border p-2 text-left font-mono text-xs",
                    isActive
                      ? "border-neutral-950 ring-2 ring-neutral-950"
                      : "border-neutral-300 hover:bg-muted",
                  ].join(" ")}
                >
                  <div className="font-medium">{spec.label}</div>
                  <div className="opacity-60">{spec.description}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-mono opacity-70">background</h2>
          <div className="grid grid-cols-2 gap-1.5">
            {ALL_BACKGROUND_PRESETS.map((preset) => {
              const spec = BACKGROUND_PRESETS[preset];
              const isActive = background === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setBackground(preset)}
                  className={[
                    "rounded border p-2 text-left font-mono text-xs",
                    isActive
                      ? "border-neutral-950 ring-2 ring-neutral-950"
                      : "border-neutral-300 hover:bg-muted",
                  ].join(" ")}
                >
                  <div
                    className="h-6 w-full rounded mb-1 border border-black/10"
                    style={{ background: spec.css }}
                  />
                  {spec.title}
                </button>
              );
            })}
          </div>
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
