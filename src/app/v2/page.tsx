"use client";

import { drawCardText } from "@/flowers/card-text-canvas";
import { BACKGROUND_PRESETS } from "@/flowers/backgrounds";
import { CARD_SIZE } from "@/flowers/constants";
import { defaultFlower } from "@/flowers/flower";
import {
  FlowerCardPreview,
  type BouquetOptions,
  type FlowerBoundsOverride,
} from "@/flowers/index";
import {
  ALL_BACKGROUND_PRESETS,
  ALL_FLOWER_TYPES,
  ALL_FONT_PAIRINGS,
  FONT_PAIRINGS,
  type BackgroundPreset,
  type FlowerCard,
  type FlowerType,
  type FontPairing,
} from "@/flowers/schema";
import { useViewportRoute } from "@/lib/use-viewport-route";
import {
  AlignLeft,
  Download,
  FileText,
  Flower2,
  Layers,
  LayoutGrid,
  Palette,
  PenLine,
  Shuffle,
  Type,
} from "lucide-react";
import {
  type ReactNode,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

/* ──────────────────────────────────────────────────────────────────────────
   v2 — mobile-native editor: locked preview ~75vh + bottom icon dock
   ─────────────────────────────────────────────────────────────────────── */

type DockTool =
  | "title"
  | "body"
  | "sign"
  | "font"
  | "color"
  | "bouquet"
  | "layout";

const INITIAL_COUNTS: Record<FlowerType, number> = {
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

const FLOWER_LABELS: Record<FlowerType, string> = {
  rose: "Rose",
  tulip: "Tulip",
  sunflower: "Sunflower",
  daisy: "Daisy",
  lavender: "Lavender",
  peony: "Peony",
  "babys-breath": "Baby's Breath",
  hydrangea: "Hydrangea",
  carnation: "Carnation",
  lily: "Lily",
  iris: "Iris",
  chrysanthemum: "Chrysanthemum",
};

type PackingPreset = {
  id: string;
  label: string;
  pad: number;
  domeRScale: number;
  domeHScale: number;
  targetDomeR: number;
};

const PACKING_PRESETS: PackingPreset[] = [
  { id: "tight", label: "Tight", pad: 0.005, domeRScale: 0.9, domeHScale: 0.4, targetDomeR: 4.2 },
  { id: "balanced", label: "Balanced", pad: 0.02, domeRScale: 1.1, domeHScale: 0.55, targetDomeR: 4.6 },
  { id: "airy", label: "Airy", pad: 0.06, domeRScale: 1.35, domeHScale: 0.75, targetDomeR: 5.2 },
  { id: "cluster", label: "Cluster", pad: 0, domeRScale: 0.75, domeHScale: 0.5, targetDomeR: 4.0 },
  { id: "spread", label: "Spread", pad: 0.04, domeRScale: 1.5, domeHScale: 0.3, targetDomeR: 5.6 },
];

export default function MobileEditorPage() {
  const ready = useViewportRoute("mobile");
  // Card content
  const [title, setTitle] = useState("Happy Mother's Day");
  const [body, setBody] = useState(
    "Thank you for everything, Mom — today and every day.",
  );
  const [signature, setSignature] = useState("— with all my love");
  const [fontPairing, setFontPairing] = useState<FontPairing>("serif-classic");
  const [background, setBackground] = useState<BackgroundPreset>("blush");
  const [flowersInFront, setFlowersInFront] = useState(false);
  const [counts, setCounts] = useState<Record<FlowerType, number>>(INITIAL_COUNTS);

  // Layout
  const [activePreset, setActivePreset] = useState("balanced");
  const [pad, setPad] = useState(0.02);
  const [domeRScale, setDomeRScale] = useState(1.1);
  const [domeHScale, setDomeHScale] = useState(0.55);
  const [targetDomeR, setTargetDomeR] = useState(4.6);
  const [bouquetSeed, setBouquetSeed] = useState(0);

  // Active tool in the dock
  const [tool, setTool] = useState<DockTool>("title");

  // Split into stable sub-objects so changing the title doesn't make
  // `card.bouquet` a new reference (which would force the Bouquet
  // component to re-pack every flower head).
  const cardContent = useMemo(
    () => ({ title, body, signature, fontPairing }),
    [title, body, signature, fontPairing],
  );
  const cardBouquet = useMemo(
    () => ({
      flowers: ALL_FLOWER_TYPES.flatMap((type) =>
        counts[type] > 0 ? [{ type, count: counts[type] }] : [],
      ),
    }),
    [counts],
  );
  const card: FlowerCard = useMemo(
    () => ({
      content: cardContent,
      bouquet: cardBouquet,
      background,
    }),
    [cardContent, cardBouquet, background],
  );

  const bouquetOptions: BouquetOptions = useMemo(
    () => ({
      pad,
      domeRScale,
      domeHScale,
      targetDomeR,
      seed: bouquetSeed,
    }),
    [pad, domeRScale, domeHScale, targetDomeR, bouquetSeed],
  );

  const applyPreset = (preset: PackingPreset) => {
    setActivePreset(preset.id);
    setPad(preset.pad);
    setDomeRScale(preset.domeRScale);
    setDomeHScale(preset.domeHScale);
    setTargetDomeR(preset.targetDomeR);
  };

  const setCount = (type: FlowerType, value: number) => {
    setCounts((c) => ({ ...c, [type]: Math.max(0, Math.floor(value)) }));
  };

  const bgSpec = BACKGROUND_PRESETS[background];

  if (!ready)
    return <main className="fixed inset-0 bg-neutral-100" />;

  return (
    <main className="fixed inset-0 flex flex-col bg-neutral-100 overflow-hidden">

      {/* preview region — sized to the card's natural footprint so no
          dead vertical space sits between preview and drawer. */}
      <div className="relative flex-none flex items-center justify-center px-4 pt-4 pb-2">
        <PreviewPane
          card={card}
          bouquetOptions={bouquetOptions}
          flowersInFront={flowersInFront}
        />
      </div>

      {/* control region — same gray as the page so the card is the
          only thing that pops; no border, no shadow. */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex-1 min-h-0 flex flex-col">
          {tool === "title" && <TitlePanel title={title} onTitle={setTitle} />}
          {tool === "body" && <BodyPanel body={body} onBody={setBody} />}
          {tool === "sign" && (
            <SignPanel signature={signature} onSignature={setSignature} />
          )}
          {tool === "font" && (
            <FontPanel fontPairing={fontPairing} onFontPairing={setFontPairing} />
          )}
          {tool === "color" && (
            <ColorPanel background={background} onBackground={setBackground} />
          )}
          {tool === "bouquet" && (
            <BouquetPanel counts={counts} onCount={setCount} />
          )}
          {tool === "layout" && (
            <LayoutPanel
              activePreset={activePreset}
              onPreset={applyPreset}
              onShuffle={() =>
                setBouquetSeed((s) => (s + 1 + Math.floor(Math.random() * 7)) % 100)
              }
              flowersInFront={flowersInFront}
              onFlowersInFront={setFlowersInFront}
            />
          )}
        </div>

        <Dock active={tool} onSelect={setTool} />
      </div>
    </main>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Preview pane — sized to fit the 75vh region, preserves card aspect.
   ─────────────────────────────────────────────────────────────────────── */

function PreviewPane({
  card,
  bouquetOptions,
  flowersInFront,
}: {
  card: FlowerCard;
  bouquetOptions: BouquetOptions;
  flowersInFront: boolean;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ width: number; height: number }>({
    width: CARD_SIZE.width,
    height: CARD_SIZE.height,
  });
  const [downloading, setDownloading] = useState(false);
  const bgSpec = BACKGROUND_PRESETS[card.background];

  useLayoutEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const aspect = CARD_SIZE.height / CARD_SIZE.width;

    const recompute = () => {
      // Use the parent's available width as the constraint; cap height
      // at 70% of viewport so the drawer always has its share. The card
      // takes whichever dimension is the binding limit.
      const parent = el.parentElement;
      const maxW = parent ? parent.clientWidth - 32 : el.clientWidth;
      if (!maxW) return;
      const maxH = window.innerHeight * 0.7;
      const widthFromHeight = maxH / aspect;
      const w = Math.min(maxW, widthFromHeight, CARD_SIZE.width);
      const nextW = Math.round(w);
      const nextH = Math.round(w * aspect);
      setSize((prev) =>
        prev.width === nextW && prev.height === nextH
          ? prev
          : { width: nextW, height: nextH },
      );
    };
    recompute();
    const ro = new ResizeObserver(recompute);
    if (el.parentElement) ro.observe(el.parentElement);
    return () => ro.disconnect();
  }, []);

  async function downloadCard() {
    if (downloading || !wrapperRef.current) return;
    setDownloading(true);
    try {
      const root = wrapperRef.current.querySelector<HTMLElement>(
        "[data-card-preview='true']",
      );
      if (!root) return;
      const canvases = root.querySelectorAll<HTMLCanvasElement>("canvas");
      if (canvases.length === 0) return;
      const webglCanvas = canvases[0];

      const rect = root.getBoundingClientRect();
      const exportDpr = Math.max(2, Math.min(4, 1600 / rect.width));
      const W = Math.round(rect.width * exportDpr);
      const H = Math.round(rect.height * exportDpr);

      const out = document.createElement("canvas");
      out.width = W;
      out.height = H;
      const ctx = out.getContext("2d");
      if (!ctx) return;

      ctx.fillStyle =
        bgSpec.css.startsWith("linear-gradient") ? "#ffffff" : bgSpec.css;
      ctx.fillRect(0, 0, W, H);
      // For gradient backgrounds we'd need a parser; here we paint a flat
      // approximation. For now solid colors look right; gradients show as
      // their first-color fill, acceptable.
      // … or just rely on CSS painting via two drawImages later.

      await document.fonts.ready;
      const textOut = document.createElement("canvas");
      textOut.width = W;
      textOut.height = H;
      drawCardText(textOut, card, rect.width, rect.height);

      if (flowersInFront) {
        ctx.drawImage(textOut, 0, 0);
        ctx.drawImage(webglCanvas, 0, 0, W, H);
      } else {
        ctx.drawImage(webglCanvas, 0, 0, W, H);
        ctx.drawImage(textOut, 0, 0);
      }

      const blob: Blob | null = await new Promise((resolve) =>
        out.toBlob((b) => resolve(b), "image/png"),
      );
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "mothers-day-card.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div ref={wrapperRef} className="relative w-full h-full flex items-center justify-center">
      <div
        className="overflow-hidden rounded-2xl ring-1 ring-black/5"
        style={{
          width: size.width,
          height: size.height,
          filter: `drop-shadow(0 30px 60px ${bgSpec.foreground}22) drop-shadow(0 8px 20px ${bgSpec.foreground}1a)`,
        }}
      >
        <FlowerCardPreview
          card={card}
          bouquetOptions={bouquetOptions}
          size={size}
          flowersInFront={flowersInFront}
        />
      </div>
      <button
        type="button"
        onClick={downloadCard}
        disabled={downloading}
        title={downloading ? "Saving…" : "Download"}
        aria-label="Download card"
        className="absolute top-3 right-3 size-9 rounded-full bg-white/85 text-neutral-800 shadow border border-black/5 flex items-center justify-center disabled:opacity-50"
      >
        <Download className="size-4" />
      </button>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Tool panels
   ─────────────────────────────────────────────────────────────────────── */

const FIELD_CLASS =
  "block w-full h-full px-4 py-3 bg-white border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:border-transparent placeholder:text-neutral-300 resize-none box-border";

function preventEnter(e: React.KeyboardEvent<HTMLTextAreaElement>) {
  if (e.key === "Enter") e.preventDefault();
}

function TitlePanel({
  title,
  onTitle,
}: {
  title: string;
  onTitle: (s: string) => void;
}) {
  return (
    <FullHeightField label="Title">
      <textarea
        value={title}
        onChange={(e) => onTitle(e.target.value)}
        onKeyDown={preventEnter}
        autoFocus
        placeholder="Happy Mother's Day"
        className={`${FIELD_CLASS} text-2xl font-medium leading-tight`}
      />
    </FullHeightField>
  );
}

function BodyPanel({
  body,
  onBody,
}: {
  body: string;
  onBody: (s: string) => void;
}) {
  return (
    <FullHeightField label="Body">
      <textarea
        value={body}
        onChange={(e) => onBody(e.target.value)}
        autoFocus
        placeholder="A short message for Mom…"
        className={`${FIELD_CLASS} text-base leading-relaxed`}
      />
    </FullHeightField>
  );
}

function SignPanel({
  signature,
  onSignature,
}: {
  signature: string;
  onSignature: (s: string) => void;
}) {
  return (
    <FullHeightField label="Signature">
      <textarea
        value={signature}
        onChange={(e) => onSignature(e.target.value)}
        onKeyDown={preventEnter}
        autoFocus
        placeholder="— with all my love"
        className={`${FIELD_CLASS} text-lg italic leading-tight`}
      />
    </FullHeightField>
  );
}

/* Wrapper for textbox panels: has its own padding (these don't scroll). */
function FullHeightField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 h-full min-h-0 px-4 pt-3 pb-3">
      <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
        {label}
      </span>
      {/* Extra horizontal slack so the focus ring (ring-2 = 2px outside)
          doesn't get clipped against the screen edge. */}
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}

function FontPanel({
  fontPairing,
  onFontPairing,
}: {
  fontPairing: FontPairing;
  onFontPairing: (p: FontPairing) => void;
}) {
  return (
    <div className="overflow-y-auto h-full">
      <div className="flex flex-col gap-2 px-3 pt-3 pb-3">
        {ALL_FONT_PAIRINGS.map((id) => {
          const spec = FONT_PAIRINGS[id];
          const active = fontPairing === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onFontPairing(id)}
              className={[
                "rounded-2xl border px-4 py-3.5 text-left flex items-baseline justify-between gap-3",
                active
                  ? "border-neutral-950 bg-neutral-950 text-white shadow-md"
                  : "border-neutral-200 bg-linear-to-br from-neutral-50 to-white shadow-sm",
              ].join(" ")}
            >
              <div>
                <div className="text-base font-medium">{spec.label}</div>
                <div
                  className={[
                    "text-[11px] mt-0.5",
                    active ? "text-neutral-300" : "text-neutral-500",
                  ].join(" ")}
                >
                  {spec.titleFamily} · {spec.bodyFamily}
                </div>
              </div>
              <div
                className={[
                  "text-2xl shrink-0 leading-none italic",
                  active ? "text-white" : "text-neutral-400",
                ].join(" ")}
                style={{ fontFamily: `'${spec.titleFamily}', serif` }}
              >
                Aa
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ColorPanel({
  background,
  onBackground,
}: {
  background: BackgroundPreset;
  onBackground: (b: BackgroundPreset) => void;
}) {
  return (
    <div className="overflow-y-auto h-full">
      <div className="grid grid-cols-3 gap-2 px-3 pt-3 pb-3">
        {ALL_BACKGROUND_PRESETS.map((preset) => {
          const spec = BACKGROUND_PRESETS[preset];
          const active = background === preset;
          return (
            <button
              key={preset}
              type="button"
              onClick={() => onBackground(preset)}
              className={[
                "rounded-xl p-1 border-2",
                active
                  ? "border-neutral-950"
                  : "border-transparent bg-white shadow-xs",
              ].join(" ")}
            >
              <div
                className="aspect-square w-full rounded-lg border border-black/5 shadow-inner"
                style={{ background: spec.css }}
              />
              <div className="mt-1 text-[10px] text-center font-medium text-neutral-600 truncate">
                {spec.title}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function BouquetPanel({
  counts,
  onCount,
}: {
  counts: Record<FlowerType, number>;
  onCount: (t: FlowerType, v: number) => void;
}) {
  return (
    <div className="overflow-y-auto h-full">
      <div className="grid grid-cols-2 gap-2 px-3 pt-3 pb-3">
        {ALL_FLOWER_TYPES.map((type) => {
          const c = counts[type];
          const active = c > 0;
          const color = defaultFlower(type).color;
          return (
            <div
              key={type}
              className={[
                "rounded-2xl border p-3",
                active
                  ? "border-neutral-300 bg-white shadow-sm"
                  : "border-neutral-200/70 bg-white/40",
              ].join(" ")}
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  aria-hidden
                  className="inline-block size-2.5 rounded-full ring-1 ring-black/5 shrink-0"
                  style={{
                    background: color,
                    opacity: active ? 1 : 0.4,
                  }}
                />
                <div
                  className={[
                    "text-sm truncate",
                    active ? "font-medium text-neutral-950" : "text-neutral-500",
                  ].join(" ")}
                >
                  {FLOWER_LABELS[type]}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => onCount(type, c - 1)}
                  disabled={c <= 0}
                  className="size-9 rounded-lg bg-neutral-100/80 active:bg-neutral-200 disabled:opacity-30 text-lg leading-none"
                >
                  −
                </button>
                <span className="text-base font-semibold tabular-nums w-8 text-center">
                  {c}
                </span>
                <button
                  type="button"
                  onClick={() => onCount(type, c + 1)}
                  className="size-9 rounded-lg bg-neutral-100/80 active:bg-neutral-200 text-lg leading-none transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LayoutPanel({
  activePreset,
  onPreset,
  onShuffle,
  flowersInFront,
  onFlowersInFront,
}: {
  activePreset: string;
  onPreset: (p: PackingPreset) => void;
  onShuffle: () => void;
  flowersInFront: boolean;
  onFlowersInFront: (v: boolean) => void;
}) {
  return (
    <div className="flex flex-col gap-3 h-full min-h-0 px-3 pt-3 pb-3">
      <div className="grid grid-cols-2 gap-2 overflow-y-auto pb-1">
        {PACKING_PRESETS.map((preset) => {
          const active = activePreset === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onPreset(preset)}
              className={[
                "rounded-2xl border px-4 py-3 text-left",
                active
                  ? "border-neutral-950 bg-neutral-950 text-white shadow-md"
                  : "border-neutral-200/70 bg-white/60 hover:bg-white",
              ].join(" ")}
            >
              <div className="text-sm font-medium">{preset.label}</div>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={onShuffle}
        className="w-full inline-flex items-center justify-center gap-2 px-3 py-3 rounded-2xl bg-neutral-950 text-white text-sm font-medium shadow-md"
      >
        <Shuffle className="size-4" />
        Shuffle arrangement
      </button>
      <label className="flex items-center justify-between rounded-2xl border border-neutral-200/70 bg-white/60 px-4 py-3 cursor-pointer">
        <div className="flex items-center gap-2">
          <Layers className="size-4 text-neutral-600" />
          <span className="text-sm">Flowers in front of text</span>
        </div>
        <input
          type="checkbox"
          checked={flowersInFront}
          onChange={(e) => onFlowersInFront(e.target.checked)}
          className="size-5 accent-neutral-950"
        />
      </label>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Dock — horizontally scrollable
   ─────────────────────────────────────────────────────────────────────── */

function Dock({
  active,
  onSelect,
}: {
  active: DockTool;
  onSelect: (t: DockTool) => void;
}) {
  const items: { id: DockTool; label: string; Icon: typeof Type }[] = [
    { id: "title", label: "Title", Icon: Type },
    { id: "body", label: "Body", Icon: AlignLeft },
    { id: "sign", label: "Sign", Icon: PenLine },
    { id: "font", label: "Font", Icon: FileText },
    { id: "color", label: "Color", Icon: Palette },
    { id: "bouquet", label: "Bouquet", Icon: Flower2 },
    { id: "layout", label: "Layout", Icon: LayoutGrid },
  ];
  return (
    <div className="flex-none">
      <div
        className="overflow-x-auto scrollbar-thin"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="flex items-stretch gap-1 px-2 py-1.5 w-max min-w-full">
          {items.map(({ id, label, Icon }) => {
            const isActive = id === active;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onSelect(id)}
                className={[
                  "flex flex-col items-center justify-center gap-0.5 px-4 py-2 rounded-xl min-w-17",
                  isActive
                    ? "bg-neutral-950 text-white shadow-md"
                    : "text-neutral-500",
                ].join(" ")}
              >
                <Icon className="size-5" strokeWidth={isActive ? 2.4 : 1.8} />
                <span className="text-[10px] font-medium">{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Building blocks
   ─────────────────────────────────────────────────────────────────────── */

function PanelStack({ children }: { children: ReactNode }) {
  return <div className="space-y-3">{children}</div>;
}

function FieldGroup({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
        {label}
      </span>
      {children}
    </label>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="text-[11px] font-medium uppercase tracking-wider text-neutral-500 mt-2">
      {children}
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (b: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between py-2 cursor-pointer">
      <span className="text-sm text-neutral-800">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={[
          "relative inline-flex h-7 w-12 items-center rounded-full transition-colors",
          checked ? "bg-neutral-950" : "bg-neutral-300",
        ].join(" ")}
      >
        <span
          className={[
            "inline-block size-5 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-6" : "translate-x-1",
          ].join(" ")}
        />
      </button>
    </label>
  );
}

