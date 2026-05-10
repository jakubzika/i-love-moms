"use client";

import { useEffect, useRef } from "react";
import { layoutWithLines, prepareWithSegments } from "@chenglou/pretext";
import { BACKGROUND_PRESETS } from "./backgrounds";
import { FONT_PAIRINGS, type FlowerCard } from "./schema";

/** Renders the card's title/body/signature into a 2D canvas using
 * Pretext for layout (correct line-breaks, glyph-accurate widths) and
 * the browser's Canvas2D engine for drawing. The result is identical
 * pixels whether displayed live or composited into a download. */
export function CardTextCanvas({
  card,
  width,
  height,
  className,
  style,
}: {
  card: FlowerCard;
  width: number;
  height: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    // Wait for fonts to be ready so the first paint isn't with fallbacks.
    document.fonts.ready.then(() => {
      if (cancelled) return;
      drawCardText(canvas, card, width, height);
    });
    return () => {
      cancelled = true;
    };
  }, [card, width, height]);

  const dpr = typeof window !== "undefined" ? window.devicePixelRatio : 1;
  return (
    <canvas
      ref={canvasRef}
      width={Math.round(width * dpr)}
      height={Math.round(height * dpr)}
      className={className}
      style={{
        width,
        height,
        ...style,
      }}
    />
  );
}

/** Pure draw function — exported so the download path can run it on a
 * larger output canvas at any DPR without going through React. */
export function drawCardText(
  canvas: HTMLCanvasElement,
  card: FlowerCard,
  width: number,
  height: number,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  // Use the canvas's actual pixel size (set via width/height attr) and
  // derive a scale from the requested CSS size.
  const scale = canvas.width / width;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.clearRect(0, 0, width, height);

  const pairing = FONT_PAIRINGS[card.content.fontPairing];
  const bgSpec = BACKGROUND_PRESETS[card.background];

  // Match the visual sizing logic from the live HTML overlay: titleEm
  // shrinks past 25 chars; pairings 'editorial' and 'clean' get -10%.
  const fontSizeBase = (16 * width) / 600;
  const titleLen = Math.max(8, card.content.title.trim().length);
  const titlePairingScale =
    card.content.fontPairing === "editorial" ||
    card.content.fontPairing === "clean"
      ? 0.9
      : 1;
  const titleEm =
    Math.max(2, Math.min(4, (3 * 25) / titleLen)) * titlePairingScale;

  const titleSize = fontSizeBase * titleEm;
  const bodySize = fontSizeBase * 1;
  const sigSize = fontSizeBase * 0.875;

  const titleFont = `700 ${titleSize}px "${pairing.titleFamily}", serif`;
  const bodyFont = `400 ${bodySize}px "${pairing.bodyFamily}", sans-serif`;
  const sigFont = `italic 400 ${sigSize}px "${pairing.bodyFamily}", sans-serif`;

  const padding = fontSizeBase * 1.25;
  const gap = fontSizeBase * 0.75;
  const sigGap = fontSizeBase * 0.25;
  const maxWidth = width - padding * 2;

  const titleLineH = titleSize * 1.2;
  const bodyLineH = bodySize * 1.5;
  const sigLineH = sigSize * 1.4;

  // Pretext prepare + layout each block.
  const titlePrep = prepareWithSegments(card.content.title, titleFont);
  const titleLayout = layoutWithLines(titlePrep, maxWidth, titleLineH);

  // Body may have explicit \n line breaks — Pretext respects whitespace
  // mode "pre-line" via prepare options. We default; pre-line gives us
  // line breaks at \n while still wrapping inside.
  const bodyPrep = prepareWithSegments(card.content.body, bodyFont, {
    whiteSpace: "pre-wrap",
  });
  const bodyLayout = layoutWithLines(bodyPrep, maxWidth, bodyLineH);

  let sigPrep: ReturnType<typeof prepareWithSegments> | null = null;
  let sigLayout: ReturnType<typeof layoutWithLines> | null = null;
  if (card.content.signature) {
    sigPrep = prepareWithSegments(card.content.signature, sigFont);
    sigLayout = layoutWithLines(sigPrep, maxWidth, sigLineH);
  }

  const totalH =
    titleLayout.height +
    gap +
    bodyLayout.height +
    (sigLayout ? sigGap + sigLayout.height : 0);

  // Bottom-anchor the whole stack inside the card with `padding`.
  let y = height - padding - totalH;

  ctx.fillStyle = bgSpec.foreground;
  ctx.textBaseline = "top";

  ctx.font = titleFont;
  for (const line of titleLayout.lines) {
    ctx.fillText(line.text, padding, y);
    y += titleLineH;
  }
  y = y - titleLayout.lines.length * titleLineH + titleLayout.height + gap;

  ctx.font = bodyFont;
  for (const line of bodyLayout.lines) {
    ctx.fillText(line.text, padding, y);
    y += bodyLineH;
  }
  y = y - bodyLayout.lines.length * bodyLineH + bodyLayout.height;

  if (sigLayout) {
    y += sigGap;
    ctx.font = sigFont;
    const prevAlpha = ctx.globalAlpha;
    ctx.globalAlpha = 0.85;
    for (const line of sigLayout.lines) {
      ctx.fillText(line.text, padding, y);
      y += sigLineH;
    }
    ctx.globalAlpha = prevAlpha;
  }
}
