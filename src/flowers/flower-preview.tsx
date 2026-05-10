"use client";

import { useFlowerCard } from "@/context/flower-card-context";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useRef, useState } from "react";
import { FlowerCardPreview } from ".";
import { BACKGROUND_PRESETS } from "./backgrounds";
import { FONT_PAIRINGS } from "./schema";

export function FlowerPreview() {
  const { displayCard } = useFlowerCard();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const bgSpec = BACKGROUND_PRESETS[displayCard.background];

  async function downloadCard() {
    if (downloading || !wrapperRef.current) return;
    setDownloading(true);
    try {
      const root = wrapperRef.current.querySelector<HTMLElement>(
        "[data-card-preview='true']",
      );
      if (!root) return;
      const webglCanvas = root.querySelector<HTMLCanvasElement>("canvas");
      if (!webglCanvas) return;

      const rect = root.getBoundingClientRect();
      const scale = 2;
      const W = Math.round(rect.width * scale);
      const H = Math.round(rect.height * scale);

      const out = document.createElement("canvas");
      out.width = W;
      out.height = H;
      const ctx = out.getContext("2d");
      if (!ctx) return;

      paintBackground(ctx, W, H, bgSpec.css);
      ctx.drawImage(webglCanvas, 0, 0, W, H);
      drawCardText(ctx, W, H, displayCard, scale);

      out.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "mothers-day-card.png";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }, "image/png");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div ref={wrapperRef} className="flex flex-col items-center gap-4">
      <div
        className="overflow-hidden rounded-2xl ring-1 ring-black/5"
        style={
          {
            filter: `drop-shadow(0 30px 60px ${bgSpec.foreground}22) drop-shadow(0 8px 20px ${bgSpec.foreground}1a)`,
          } as React.CSSProperties
        }
      >
        <FlowerCardPreview card={displayCard} />
      </div>
      <Button
        type="button"
        size="sm"
        onClick={downloadCard}
        disabled={downloading}
        className="shadow-md"
      >
        <Download data-icon="inline-start" className="size-3.5" />
        {downloading ? "Saving…" : "Download"}
      </Button>
    </div>
  );
}

function paintBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  css: string,
) {
  // Solid hex / rgb
  if (!css.startsWith("linear-gradient")) {
    ctx.fillStyle = css;
    ctx.fillRect(0, 0, w, h);
    return;
  }
  // Parse: linear-gradient(135deg, #aaa 0%, #bbb 100%)
  const match = css.match(/linear-gradient\(([^)]+)\)/);
  if (!match) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    return;
  }
  const parts = splitTopLevel(match[1]);
  const angleStr = parts[0]?.trim() ?? "180deg";
  const angleDeg = parseFloat(angleStr.replace("deg", "")) || 135;
  // CSS angle: 0deg = up. Convert to canvas direction (radians from x-axis)
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  const cx = w / 2;
  const cy = h / 2;
  const len = Math.max(w, h);
  const dx = (Math.cos(rad) * len) / 2;
  const dy = (Math.sin(rad) * len) / 2;
  const grad = ctx.createLinearGradient(cx - dx, cy - dy, cx + dx, cy + dy);

  for (let i = 1; i < parts.length; i++) {
    const stop = parts[i].trim();
    const m = stop.match(/^(.+?)\s+(\d+(?:\.\d+)?)%$/);
    if (m) {
      grad.addColorStop(parseFloat(m[2]) / 100, m[1].trim());
    } else {
      grad.addColorStop((i - 1) / (parts.length - 2), stop);
    }
  }

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

function splitTopLevel(input: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let buf = "";
  for (const ch of input) {
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      parts.push(buf);
      buf = "";
    } else {
      buf += ch;
    }
  }
  if (buf) parts.push(buf);
  return parts;
}

function drawCardText(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  card: ReturnType<typeof useFlowerCard>["displayCard"],
  scale: number,
) {
  const pairing = FONT_PAIRINGS[card.content.fontPairing];
  const bgSpec = BACKGROUND_PRESETS[card.background];

  const padding = 20 * scale;
  const x = padding;
  const maxW = w - padding * 2;

  ctx.fillStyle = bgSpec.foreground;
  ctx.textBaseline = "top";

  const titleSize = 30 * scale;
  const bodySize = 16 * scale;
  const sigSize = 14 * scale;
  const titleFont = `700 ${titleSize}px "${pairing.titleFamily}", serif`;
  const bodyFont = `400 ${bodySize}px "${pairing.bodyFamily}", sans-serif`;
  const sigFont = `italic 400 ${sigSize}px "${pairing.bodyFamily}", sans-serif`;

  // Pass 1: measure total height
  let totalH = 0;
  ctx.font = titleFont;
  totalH += wrapText(ctx, card.content.title, 0, 0, maxW, titleSize * 1.1, true);
  totalH += 8 * scale;
  ctx.font = bodyFont;
  for (const line of card.content.body.split("\n")) {
    totalH += wrapText(ctx, line, 0, 0, maxW, bodySize * 1.5, true);
  }
  if (card.content.signature) {
    totalH += 6 * scale;
    ctx.font = sigFont;
    totalH += wrapText(
      ctx,
      card.content.signature,
      0,
      0,
      maxW,
      sigSize * 1.4,
      true,
    );
  }

  // Pass 2: paint, bottom-aligned
  let y = h - padding - totalH;

  ctx.font = titleFont;
  y = wrapText(ctx, card.content.title, x, y, maxW, titleSize * 1.1, false);

  y += 8 * scale;
  ctx.font = bodyFont;
  for (const line of card.content.body.split("\n")) {
    y = wrapText(ctx, line, x, y, maxW, bodySize * 1.5, false);
  }

  if (card.content.signature) {
    y += 6 * scale;
    ctx.font = sigFont;
    const prevAlpha = ctx.globalAlpha;
    ctx.globalAlpha = 0.85;
    wrapText(ctx, card.content.signature, x, y, maxW, sigSize * 1.4, false);
    ctx.globalAlpha = prevAlpha;
  }
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  dryRun = false,
): number {
  const words = text.split(/\s+/);
  let line = "";
  let cursor = y;
  for (const word of words) {
    const test = line ? line + " " + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      if (!dryRun) ctx.fillText(line, x, cursor);
      cursor += lineHeight;
      line = word;
    } else {
      line = test;
    }
  }
  if (line) {
    if (!dryRun) ctx.fillText(line, x, cursor);
    cursor += lineHeight;
  }
  return dryRun ? cursor - y : cursor;
}
