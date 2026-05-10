"use client";

import { Button } from "@/components/ui/button";
import { BACKGROUND_PRESETS } from "@/flowers/backgrounds";
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
import { Download, Minus, Plus, Shuffle, Wrench } from "lucide-react";
import { useMemo, useRef, useState } from "react";

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

const DEFAULT_FLOWER_SCALES: Record<FlowerType, number> = {
  rose: 1,
  tulip: 1,
  sunflower: 1,
  daisy: 1,
  lavender: 1,
  peony: 1,
  "babys-breath": 1,
  hydrangea: 0.7,
  carnation: 1,
  lily: 1,
  iris: 1,
  chrysanthemum: 1,
};

const DEFAULT_FLOWER_BOUNDS: Record<FlowerType, FlowerBoundsOverride> = {
  rose: { rx: 1, ry: 1, rz: 1 },
  tulip: { rx: 1, ry: 1, rz: 1 },
  sunflower: { rx: 1, ry: 1, rz: 1 },
  daisy: { rx: 1, ry: 1, rz: 1 },
  lavender: { rx: 1, ry: 1, rz: 1 },
  peony: { rx: 1, ry: 1, rz: 1 },
  "babys-breath": { rx: 1, ry: 1, rz: 1 },
  hydrangea: { rx: 1, ry: 1, rz: 1 },
  carnation: { rx: 1, ry: 1, rz: 1 },
  lily: { rx: 1, ry: 1, rz: 1 },
  iris: { rx: 1, ry: 1, rz: 1 },
  chrysanthemum: { rx: 1, ry: 1, rz: 1 },
};

type PackingPreset = {
  id: string;
  label: string;
  description: string;
  pad: number;
  domeRScale: number;
  domeHScale: number;
  headBoundsScale: number;
  targetDomeR: number;
};

const PACKING_PRESETS: PackingPreset[] = [
  {
    id: "tight",
    label: "Tight",
    description: "Heads close together, low dome.",
    pad: 0.005,
    domeRScale: 0.9,
    domeHScale: 0.4,
    headBoundsScale: 0.85,
    targetDomeR: 4.2,
  },
  {
    id: "balanced",
    label: "Balanced",
    description: "Default packing, gentle dome.",
    pad: 0.02,
    domeRScale: 1.1,
    domeHScale: 0.55,
    headBoundsScale: 1.0,
    targetDomeR: 4.6,
  },
  {
    id: "airy",
    label: "Airy",
    description: "Loose spacing, taller silhouette.",
    pad: 0.06,
    domeRScale: 1.35,
    domeHScale: 0.75,
    headBoundsScale: 1.1,
    targetDomeR: 5.2,
  },
  {
    id: "cluster",
    label: "Cluster",
    description: "Heads pile together, very compact.",
    pad: 0.0,
    domeRScale: 0.75,
    domeHScale: 0.5,
    headBoundsScale: 0.7,
    targetDomeR: 4.0,
  },
  {
    id: "spread",
    label: "Spread",
    description: "Wide, flat arrangement.",
    pad: 0.04,
    domeRScale: 1.5,
    domeHScale: 0.3,
    headBoundsScale: 1.0,
    targetDomeR: 5.6,
  },
];

export default function BuilderPage() {
  const [title, setTitle] = useState("Happy Mother's Day");
  const [body, setBody] = useState(
    "Thank you for everything, Mom — today and every day.",
  );
  const [signature, setSignature] = useState("— with all my love");
  const [fontPairing, setFontPairing] = useState<FontPairing>("editorial");
  const [background, setBackground] = useState<BackgroundPreset>("ivory");
  const [counts, setCounts] = useState<Record<FlowerType, number>>(INITIAL_COUNTS);

  // Technical / debug controls
  const [technicalMode, setTechnicalMode] = useState(false);
  const [activePreset, setActivePreset] = useState<string>("balanced");
  const [flowerScales, setFlowerScales] = useState<Record<FlowerType, number>>(
    DEFAULT_FLOWER_SCALES,
  );
  const [flowerBounds, setFlowerBounds] = useState<
    Record<FlowerType, FlowerBoundsOverride>
  >(DEFAULT_FLOWER_BOUNDS);
  const [pad, setPad] = useState(0.02);
  const [domeRScale, setDomeRScale] = useState(1.1);
  const [domeHScale, setDomeHScale] = useState(0.55);
  const [headBoundsScale, setHeadBoundsScale] = useState(1);
  const [bouquetSeed, setBouquetSeed] = useState(0);
  const [targetDomeR, setTargetDomeR] = useState(4.6);
  const [showBounds, setShowBounds] = useState(false);

  const applyPreset = (preset: PackingPreset) => {
    setActivePreset(preset.id);
    setPad(preset.pad);
    setDomeRScale(preset.domeRScale);
    setDomeHScale(preset.domeHScale);
    setHeadBoundsScale(preset.headBoundsScale);
    setTargetDomeR(preset.targetDomeR);
  };

  const shuffleLayout = () => {
    setBouquetSeed((s) => (s + 1 + Math.floor(Math.random() * 7)) % 100);
  };

  // Riso shader controls
  const [risoEnabled, setRisoEnabled] = useState(true);
  const [risoGrain, setRisoGrain] = useState(0.55);
  const [risoGrainScale, setRisoGrainScale] = useState(1.6);
  const [risoMisreg, setRisoMisreg] = useState(1.4);
  const [risoPosterize, setRisoPosterize] = useState(4);
  const [risoDither, setRisoDither] = useState(0.6);

  const card: FlowerCard = useMemo(
    () => ({
      content: { title, body, signature, fontPairing },
      bouquet: {
        flowers: ALL_FLOWER_TYPES.flatMap((type) =>
          counts[type] > 0 ? [{ type, count: counts[type] }] : [],
        ),
      },
      background,
    }),
    [title, body, signature, fontPairing, background, counts],
  );

  const bouquetOptions: BouquetOptions = useMemo(
    () => ({
      perFlowerScale: flowerScales,
      perFlowerBounds: flowerBounds,
      pad,
      domeRScale,
      domeHScale,
      headBoundsScale,
      seed: bouquetSeed,
      targetDomeR,
      showBounds,
      riso: risoEnabled
        ? {
            grain: risoGrain,
            grainScale: risoGrainScale,
            misregistration: risoMisreg,
            posterize: risoPosterize,
            ditherStrength: risoDither,
          }
        : {
            grain: 0,
            grainScale: 1,
            misregistration: 0,
            posterize: 256,
            ditherStrength: 0,
          },
    }),
    [
      flowerScales,
      flowerBounds,
      pad,
      domeRScale,
      domeHScale,
      headBoundsScale,
      bouquetSeed,
      targetDomeR,
      showBounds,
      risoEnabled,
      risoGrain,
      risoGrainScale,
      risoMisreg,
      risoPosterize,
      risoDither,
    ],
  );

  const setCount = (type: FlowerType, value: number) => {
    setCounts((c) => ({ ...c, [type]: Math.max(0, Math.floor(value)) }));
  };

  const setFlowerScale = (type: FlowerType, value: number) => {
    setFlowerScales((s) => ({ ...s, [type]: value }));
  };

  const setFlowerBound = (
    type: FlowerType,
    axis: "rx" | "ry" | "rz",
    value: number,
  ) => {
    setFlowerBounds((b) => ({
      ...b,
      [type]: { ...b[type], [axis]: value },
    }));
  };

  const resetTechnical = () => {
    setFlowerScales(DEFAULT_FLOWER_SCALES);
    setFlowerBounds(DEFAULT_FLOWER_BOUNDS);
    setPad(0.02);
    setDomeRScale(1.1);
    setDomeHScale(0.55);
    setHeadBoundsScale(1);
    setBouquetSeed(0);
    setTargetDomeR(4.6);
    setRisoEnabled(true);
    setRisoGrain(0.55);
    setRisoGrainScale(1.6);
    setRisoMisreg(1.4);
    setRisoPosterize(4);
    setRisoDither(0.6);
  };

  const bgSpec = BACKGROUND_PRESETS[background];

  return (
    <main className="relative min-h-screen">
      {/* ambient tinted background — fixed so it doesn't scroll */}
      <div
        className="fixed inset-0 -z-10 transition-all duration-700"
        style={{ background: bgSpec.css, opacity: 0.35, filter: "blur(80px)" }}
      />
      <div className="fixed inset-0 -z-10 bg-neutral-100/70" />

      <div className="mx-auto w-full max-w-7xl px-6 py-10">
        <header className="mb-8">
          <h1 className="font-instrument text-3xl font-bold tracking-tight text-neutral-950">
            Mother's Day Card
          </h1>
          <p className="text-sm text-neutral-600 mt-1">
            Pick flowers, type, and a layout for your card.
          </p>
        </header>

        <div className="grid gap-8 items-start lg:grid-cols-[minmax(0,1fr)_28rem]">
          {/* Preview — sticky to viewport top while page scrolls */}
          <div className="flex flex-col items-center gap-4 lg:sticky lg:top-6 lg:self-start lg:max-h-[calc(100vh-3rem)]">
            <PreviewWithDownload card={card} bouquetOptions={bouquetOptions} />
          </div>

          {/* Form — pushes the page height; global scrollbar handles it */}
          <aside className="space-y-7 rounded-2xl bg-white/80 backdrop-blur-xl border border-black/5 shadow-xl p-6">
            <Section title="Message">
              <Field label="Title">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-sm p-2.5 border border-neutral-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-neutral-950"
                />
              </Field>
              <Field label="Body">
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={4}
                  className="w-full text-sm p-2.5 border border-neutral-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-neutral-950 resize-none"
                />
              </Field>
              <Field label="Signature">
                <input
                  type="text"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  className="w-full text-sm p-2.5 border border-neutral-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-neutral-950"
                />
              </Field>
            </Section>

            <Section title="Typography">
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
                        "text-left rounded-lg border p-2.5 transition",
                        isActive
                          ? "border-neutral-950 bg-neutral-950 text-white"
                          : "border-neutral-200 bg-white hover:bg-neutral-50",
                      ].join(" ")}
                    >
                      <div className="text-sm font-medium">{spec.label}</div>
                      <div
                        className={[
                          "text-xs mt-0.5",
                          isActive ? "text-neutral-300" : "text-neutral-500",
                        ].join(" ")}
                      >
                        {spec.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </Section>

            <Section title="Background">
              <div className="grid grid-cols-2 gap-2">
                {ALL_BACKGROUND_PRESETS.map((preset) => {
                  const spec = BACKGROUND_PRESETS[preset];
                  const isActive = background === preset;
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setBackground(preset)}
                      className={[
                        "rounded-lg border p-2 text-left transition",
                        isActive
                          ? "border-neutral-950 ring-2 ring-neutral-950"
                          : "border-neutral-200 hover:bg-neutral-50",
                      ].join(" ")}
                    >
                      <div
                        className="h-10 w-full rounded-md mb-1.5 border border-black/5"
                        style={{ background: spec.css }}
                      />
                      <div className="text-xs font-medium">{spec.title}</div>
                    </button>
                  );
                })}
              </div>
            </Section>

            <Section title="Bouquet">
              <div className="space-y-1">
                {ALL_FLOWER_TYPES.map((type) => (
                  <FlowerStepper
                    key={type}
                    type={type}
                    count={counts[type]}
                    scale={flowerScales[type]}
                    bounds={flowerBounds[type]}
                    technicalMode={technicalMode}
                    onChange={(v) => setCount(type, v)}
                    onScaleChange={(v) => setFlowerScale(type, v)}
                    onBoundsChange={(axis, v) => setFlowerBound(type, axis, v)}
                  />
                ))}
              </div>
            </Section>

            <Section title="Layout">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {PACKING_PRESETS.map((preset) => {
                  const isActive = activePreset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className={[
                        "rounded-lg border p-2.5 text-left transition",
                        isActive
                          ? "border-neutral-950 bg-neutral-950 text-white"
                          : "border-neutral-200 bg-white hover:bg-neutral-50",
                      ].join(" ")}
                    >
                      <div className="text-sm font-medium">{preset.label}</div>
                      <div
                        className={[
                          "text-xs mt-0.5",
                          isActive ? "text-neutral-300" : "text-neutral-500",
                        ].join(" ")}
                      >
                        {preset.description}
                      </div>
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={shuffleLayout}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-sm text-neutral-800"
              >
                <Shuffle className="size-3.5" />
                Shuffle arrangement
              </button>
              <label className="flex items-center gap-2 text-xs text-neutral-600 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={technicalMode}
                  onChange={(e) => setTechnicalMode(e.target.checked)}
                  className="size-4 rounded border-neutral-300 accent-neutral-950"
                />
                <Wrench className="size-3 text-neutral-500" />
                Technical mode
              </label>
            </Section>

            {technicalMode ? (
              <Section title="Technical">
                <label className="flex items-center gap-2 text-xs text-neutral-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showBounds}
                    onChange={(e) => setShowBounds(e.target.checked)}
                    className="size-4 rounded border-neutral-300 accent-neutral-950"
                  />
                  Show collision boxes
                </label>

                <div className="space-y-2 pt-1">
                  <SliderRow
                    label="Bouquet padding"
                    value={pad}
                    min={0}
                    max={0.3}
                    step={0.005}
                    onChange={(v) => {
                      setPad(v);
                      setActivePreset("custom");
                    }}
                  />
                  <SliderRow
                    label="Dome radius scale"
                    value={domeRScale}
                    min={0.6}
                    max={2}
                    step={0.05}
                    onChange={(v) => {
                      setDomeRScale(v);
                      setActivePreset("custom");
                    }}
                  />
                  <SliderRow
                    label="Dome height scale"
                    value={domeHScale}
                    min={0.2}
                    max={1.2}
                    step={0.05}
                    onChange={(v) => {
                      setDomeHScale(v);
                      setActivePreset("custom");
                    }}
                  />
                  <SliderRow
                    label="Head bounds scale"
                    value={headBoundsScale}
                    min={0.3}
                    max={2.5}
                    step={0.05}
                    onChange={(v) => {
                      setHeadBoundsScale(v);
                      setActivePreset("custom");
                    }}
                  />
                  <SliderRow
                    label="Target dome R (zoom)"
                    value={targetDomeR}
                    min={2}
                    max={8}
                    step={0.1}
                    onChange={(v) => {
                      setTargetDomeR(v);
                      setActivePreset("custom");
                    }}
                  />
                  <div className="flex items-center gap-2 text-xs">
                    <label className="flex-1 text-neutral-700">Placement seed</label>
                    <input
                      type="number"
                      value={bouquetSeed}
                      onChange={(e) => setBouquetSeed(Number(e.target.value))}
                      className="w-16 text-center border border-neutral-200 rounded-md bg-white p-1 tabular-nums focus:outline-none focus:ring-2 focus:ring-neutral-950"
                    />
                    <button
                      type="button"
                      onClick={() => setBouquetSeed((s) => s + 1)}
                      className="text-xs px-2 py-1 rounded-md border border-neutral-200 bg-white hover:bg-neutral-100"
                    >
                      reroll
                    </button>
                  </div>
                </div>

                <div className="space-y-2 border-t border-neutral-200 pt-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-medium text-neutral-700">
                      Riso shader
                    </h3>
                    <label className="flex items-center gap-2 text-xs text-neutral-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={risoEnabled}
                        onChange={(e) => setRisoEnabled(e.target.checked)}
                        className="size-4 rounded border-neutral-300 accent-neutral-950"
                      />
                      enabled
                    </label>
                  </div>
                  <div
                    className={
                      risoEnabled
                        ? "space-y-2"
                        : "space-y-2 opacity-40 pointer-events-none"
                    }
                  >
                    <SliderRow
                      label="Grain amount"
                      value={risoGrain}
                      min={0}
                      max={1.5}
                      step={0.02}
                      onChange={setRisoGrain}
                    />
                    <SliderRow
                      label="Grain scale"
                      value={risoGrainScale}
                      min={0.3}
                      max={6}
                      step={0.1}
                      onChange={setRisoGrainScale}
                    />
                    <SliderRow
                      label="Misregistration"
                      value={risoMisreg}
                      min={0}
                      max={8}
                      step={0.1}
                      onChange={setRisoMisreg}
                    />
                    <SliderRow
                      label="Posterize"
                      value={risoPosterize}
                      min={1}
                      max={8}
                      step={1}
                      onChange={setRisoPosterize}
                    />
                    <SliderRow
                      label="Dither"
                      value={risoDither}
                      min={0}
                      max={1.5}
                      step={0.02}
                      onChange={setRisoDither}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    resetTechnical();
                    setActivePreset("balanced");
                  }}
                  className="w-full text-xs px-3 py-2 rounded-md border border-neutral-200 bg-white hover:bg-neutral-100"
                >
                  Reset technical params
                </button>
              </Section>
            ) : null}
          </aside>
        </div>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-mono uppercase tracking-wider text-neutral-500">
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-neutral-700">{label}</span>
      {children}
    </label>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex-1 text-xs text-neutral-700">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-32 accent-neutral-950"
      />
      <span className="w-12 text-right text-[10px] tabular-nums text-neutral-600">
        {value.toFixed(2)}
      </span>
    </div>
  );
}

function FlowerStepper({
  type,
  count,
  scale,
  bounds,
  technicalMode,
  onChange,
  onScaleChange,
  onBoundsChange,
}: {
  type: FlowerType;
  count: number;
  scale: number;
  bounds: FlowerBoundsOverride;
  technicalMode: boolean;
  onChange: (next: number) => void;
  onScaleChange: (next: number) => void;
  onBoundsChange: (axis: "rx" | "ry" | "rz", next: number) => void;
}) {
  return (
    <div
      className={[
        "rounded-lg border p-2 transition space-y-2",
        count > 0
          ? "border-neutral-300 bg-white"
          : "border-neutral-200 bg-neutral-50/50",
      ].join(" ")}
    >
      <div className="flex items-center gap-2">
        <span
          className={[
            "flex-1 text-sm",
            count > 0 ? "text-neutral-950 font-medium" : "text-neutral-500",
          ].join(" ")}
        >
          {FLOWER_LABELS[type]}
        </span>
        <button
          type="button"
          onClick={() => onChange(count - 1)}
          disabled={count <= 0}
          className="size-7 rounded-md border border-neutral-200 bg-white hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
          aria-label={`Decrease ${type}`}
        >
          <Minus className="size-3.5" />
        </button>
        <input
          type="number"
          min={0}
          value={count}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-12 text-center text-sm border border-neutral-200 rounded-md bg-white p-1 tabular-nums focus:outline-none focus:ring-2 focus:ring-neutral-950"
        />
        <button
          type="button"
          onClick={() => onChange(count + 1)}
          className="size-7 rounded-md border border-neutral-200 bg-white hover:bg-neutral-100 flex items-center justify-center"
          aria-label={`Increase ${type}`}
        >
          <Plus className="size-3.5" />
        </button>
      </div>
      {count > 0 && technicalMode ? (
        <div className="space-y-1.5 px-1">
          <BoundsRow
            label="size"
            value={scale}
            onChange={onScaleChange}
          />
          <details className="group">
            <summary className="cursor-pointer text-[10px] uppercase tracking-wider text-neutral-500 hover:text-neutral-950 select-none">
              collision box
            </summary>
            <div className="mt-1.5 space-y-1">
              <BoundsRow
                label="rx"
                value={bounds.rx ?? 1}
                onChange={(v) => onBoundsChange("rx", v)}
              />
              <BoundsRow
                label="ry"
                value={bounds.ry ?? 1}
                onChange={(v) => onBoundsChange("ry", v)}
              />
              <BoundsRow
                label="rz"
                value={bounds.rz ?? 1}
                onChange={(v) => onBoundsChange("rz", v)}
              />
            </div>
          </details>
        </div>
      ) : null}
    </div>
  );
}

function BoundsRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] uppercase tracking-wider text-neutral-500 w-8">
        {label}
      </span>
      <input
        type="range"
        min={0.2}
        max={2.5}
        step={0.05}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 accent-neutral-950"
      />
      <span className="w-10 text-right text-[10px] tabular-nums text-neutral-600">
        {value.toFixed(2)}×
      </span>
    </div>
  );
}

function PreviewWithDownload({
  card,
  bouquetOptions,
}: {
  card: FlowerCard;
  bouquetOptions?: BouquetOptions;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const bgSpec = BACKGROUND_PRESETS[card.background];

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
      drawCardText(ctx, W, H, card, scale);

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
        style={{
          filter: `drop-shadow(0 30px 60px ${bgSpec.foreground}22) drop-shadow(0 8px 20px ${bgSpec.foreground}1a)`,
        }}
      >
        <FlowerCardPreview card={card} bouquetOptions={bouquetOptions} />
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
  if (!css.startsWith("linear-gradient")) {
    ctx.fillStyle = css;
    ctx.fillRect(0, 0, w, h);
    return;
  }
  const match = css.match(/linear-gradient\(([^)]+)\)/);
  if (!match) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    return;
  }
  const parts = splitTopLevel(match[1]);
  const angleStr = parts[0]?.trim() ?? "180deg";
  const angleDeg = parseFloat(angleStr.replace("deg", "")) || 135;
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
    if (m) grad.addColorStop(parseFloat(m[2]) / 100, m[1].trim());
    else grad.addColorStop((i - 1) / (parts.length - 2), stop);
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
  card: FlowerCard,
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

  // Pass 1: measure
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
