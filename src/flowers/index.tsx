"use client";

import type { FlowerCard, Flower } from "./schema";

function FlowerSprite({ flower }: { flower: Flower }) {
  const sizePx =
    flower.size === "large" ? 56 : flower.size === "small" ? 28 : 40;
  return (
    <div
      title={`${flower.type} (${flower.color}) ×${flower.quantity}`}
      className="rounded-full border border-black/10 shadow-sm"
      style={{
        width: sizePx,
        height: sizePx,
        background: flower.color,
      }}
    />
  );
}

export function FlowerCardPreview({ card }: { card: FlowerCard }) {
  const flowers = card.bouquet.flowers ?? [];
  const expanded = flowers.flatMap((f, i) =>
    Array.from({ length: Math.max(1, f.quantity ?? 1) }, (_, j) => ({
      flower: f,
      key: `${i}-${j}`,
    })),
  );

  return (
    <div className="w-full h-full bg-pink-100 rounded-lg p-6 flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-center gap-3 min-h-40">
        {expanded.length === 0 ? (
          <p className="text-sm text-muted-foreground">No flowers yet.</p>
        ) : (
          expanded.map(({ flower, key }) => (
            <FlowerSprite key={key} flower={flower} />
          ))
        )}
      </div>
      <div
        className="prose prose-sm max-w-none bg-white/80 rounded p-4"
        dangerouslySetInnerHTML={{ __html: card.content.htmlContent ?? "" }}
      />
    </div>
  );
}

export const FlowerRender = () => {
  return <div className="w-full h-full bg-pink-400">KYTKA</div>;
};
