"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { MathJax, MathJaxContext } from "better-react-mathjax";
import Link from "next/link";
import {
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Mesh, MeshBasicMaterial, Quaternion, TubeGeometry, Vector3 } from "three";
import {
  GOLDEN_ANGLE_RAD,
  buildStemLeaves,
  hashSeed,
  makeBendableStemCurve,
  mulberry32,
  packBouquet,
  petalGeometry,
  phyllotaxisDisc,
  ringPositions,
  sizeScale,
  type PetalShape,
} from "@/flowers/generative";
import {
  createRisoPetalMaterial,
  createRisoStemMaterial,
  getFlowerPalette,
  setRisoUniforms,
} from "@/flowers/risoMaterial";
import { defaultFlower, type Flower } from "@/flowers/flower";
import type { FlowerType } from "@/flowers/schema";

/* ──────────────────────────────────────────────────────────────────────────
   How a flower is constructed — bottom-up
   Visuals are real WebGL renders driven by the same code paths as the
   home page. Canvases mount only when scrolled into view.
   ─────────────────────────────────────────────────────────────────────── */

const MATHJAX_CONFIG = {
  loader: { load: ["[tex]/ams"] },
  tex: {
    packages: { "[+]": ["ams"] },
    inlineMath: [["$", "$"], ["\\(", "\\)"]],
    displayMath: [["$$", "$$"], ["\\[", "\\]"]],
  },
};

export default function ExplainerPage() {
  // Calm the riso shader for the essay. The defaults work for the bouquet
  // page but read as noisy at small sizes.
  useEffect(() => {
    setRisoUniforms({
      grain: 0.18,
      grainScale: 1.6,
      misregistration: 0.4,
      posterize: 6,
      ditherStrength: 0.25,
    });
  }, []);

  return (
    <MathJaxContext config={MATHJAX_CONFIG}>
    <main className="relative min-h-screen bg-neutral-50 text-neutral-900">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <header className="mb-12">
          <p className="text-xs font-mono uppercase tracking-widest text-neutral-500">
            engineering note
          </p>
          <h1 className="mt-2 font-instrument text-5xl font-bold leading-tight">
            How a flower is constructed
          </h1>
          <p className="mt-4 text-base text-neutral-600 max-w-2xl">
            A bottom-up reading of the geometry that produces the bouquet on
            the home page. Each section uses the same code paths as the
            production renderer.
          </p>
          <div className="mt-6">
            <Link
              href="/builder"
              className="text-sm text-neutral-700 hover:text-neutral-950 underline-offset-4 hover:underline"
            >
              ← builder
            </Link>
          </div>
        </header>

        <PrimerSection />
        <PetalSection />
        <PetalLayerSection />
        <FlowerCenterSection />
        <FlowerHeadSection />
        <StemSection />
        <LeavesSection />
        <BouquetSection />

        <footer className="mt-24 pt-8 border-t border-neutral-200 text-sm text-neutral-500">
          End. Open the home page or the builder to see all of this composed.
        </footer>
      </div>
    </main>
    </MathJaxContext>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   §0 — Primer (the vocabulary every later section relies on)
   ─────────────────────────────────────────────────────────────────────── */

function PrimerSection() {
  return (
    <section className="space-y-10">
      <SectionHeader index="§0" title="Primer" />

      <Prose>
        <p>
          Before the bouquet, four ideas show up everywhere. Each is small
          on its own, but together they let us describe a complicated 3D
          object with a handful of numbers. If any of these feel familiar,
          skip to §1.
        </p>
      </Prose>

      <SubHeading>0.1 — A function is a recipe</SubHeading>

      <Prose>
        <p>
          A function takes one or more numbers in and returns one or more
          numbers out. We will write things like
        </p>
        <Display>{`f(t) = t^2`}</Display>
        <p>
          and use them as descriptions of a shape. Here <Tex>{`t`}</Tex> is
          a name for the input — by convention <Tex>{`t`}</Tex> stands for
          a "progress" parameter that walks from 0 to 1. The output{" "}
          <Tex>{`f(t)`}</Tex> can be a number, a 2D point, or a 3D point;
          we will use all three.
        </p>
        <p>The plot of <Tex>{`f(t) = t^2`}</Tex> looks like this:</p>
      </Prose>

      <Figure caption="A plain real-valued function f(t) = t². Drag the slider to see how the input maps to the output.">
        <Curve1DDemo
          fn={(t) => t * t}
          ymin={0}
          ymax={1}
          label={"t^2"}
        />
      </Figure>

      <SubHeading>0.2 — Vectors and points in 3D</SubHeading>

      <Prose>
        <p>
          A 3D point is a triple of numbers,{" "}
          <Tex>{`\\mathbf{p} = (x, y, z)`}</Tex>. We render in a
          right-handed frame: <Tex>{`+\\hat{\\mathbf{x}}`}</Tex> points
          right, <Tex>{`+\\hat{\\mathbf{y}}`}</Tex> points up,{" "}
          <Tex>{`+\\hat{\\mathbf{z}}`}</Tex> points toward you.
        </p>
        <p>
          A vector and a point look the same on the page but mean
          different things: a point is a location, a vector is a
          displacement. The expression{" "}
          <Tex>{`\\mathbf{p} + \\mathbf{v}`}</Tex> moves point{" "}
          <Tex>{`\\mathbf{p}`}</Tex> by displacement{" "}
          <Tex>{`\\mathbf{v}`}</Tex>; the expression{" "}
          <Tex>{`\\mathbf{p} - \\mathbf{q}`}</Tex> is the displacement
          from <Tex>{`\\mathbf{q}`}</Tex> to <Tex>{`\\mathbf{p}`}</Tex>.
        </p>
        <p>
          We will use <Tex>{`\\hat{\\cdot}`}</Tex> for unit vectors
          (length 1), <Tex>{`\\lVert \\cdot \\rVert`}</Tex> for length,
          and <Tex>{`\\cdot`}</Tex> for the dot product.
        </p>
      </Prose>

      <SubHeading>0.3 — A parametric curve</SubHeading>

      <Prose>
        <p>
          Take a function whose <em>output</em> is a 3D point but whose
          input is a single number <Tex>{`t \\in [0, 1]`}</Tex>:
        </p>
        <Display>{`\\mathbf{c}(t) = \\bigl( x(t),\\, y(t),\\, z(t) \\bigr)`}</Display>
        <p>
          Sweeping <Tex>{`t`}</Tex> from 0 to 1 traces out a curve in
          space. Three real-valued functions <Tex>{`x(t), y(t), z(t)`}</Tex>{" "}
          define the curve completely. Stems are parametric curves; in §5
          we choose nice <Tex>{`x, y, z`}</Tex> so the curve looks like
          a stem.
        </p>
      </Prose>

      <Figure caption="A parametric curve c(t) = (sin 2πt, t, cos 2πt) — a helix. The slider walks t along the curve.">
        <Curve3DDemo />
      </Figure>

      <SubHeading>0.4 — A parametric surface</SubHeading>

      <Prose>
        <p>
          Now use <em>two</em> input numbers,{" "}
          <Tex>{`(t, u) \\in [0, 1]^2`}</Tex>. The output is still a 3D
          point:
        </p>
        <Display>{`\\mathbf{p}(t, u) = \\bigl( x(t, u),\\, y(t, u),\\, z(t, u) \\bigr)`}</Display>
        <p>
          Sweeping the unit square traces out a surface in space. This is
          the central idea of §1: a petal is a parametric surface, where{" "}
          <Tex>{`t`}</Tex> walks the petal's length and <Tex>{`u`}</Tex>{" "}
          walks its width. We can build any thin 3D shape we want by
          choosing the three coordinate functions cleverly.
        </p>
        <p>
          To turn a parametric surface into a renderable mesh we just
          sample it on a grid: pick <Tex>{`(L+1) \\times (W+1)`}</Tex>{" "}
          points <Tex>{`(t_i, u_j) = (i/L,\\, j/W)`}</Tex>, evaluate{" "}
          <Tex>{`\\mathbf{p}(t_i, u_j)`}</Tex> at each one, and connect
          neighbours with triangles. That's the entire pipeline.
        </p>
      </Prose>

      <SubHeading>0.5 — Symbols you'll see</SubHeading>

      <Prose>
        <p>One small table, used everywhere from §1 onward:</p>
      </Prose>

      <SymbolTable
        rows={[
          ["t, u", "parameters in [0, 1]; t = progress along, u = across"],
          ["L, W", "number of length / width segments in a sampled grid"],
          ["\\mathbf{p}(t, u)", "the parametric surface function"],
          ["\\mathbf{c}(t)", "a parametric curve in 3D"],
          ["\\hat{\\mathbf{x}}, \\hat{\\mathbf{y}}, \\hat{\\mathbf{z}}", "unit vectors of the world frame"],
          ["R_x(\\alpha), R_y(\\alpha), R_z(\\alpha)", "rotations by angle α around each axis"],
          ["\\xi", "a uniform random number in [0, 1]"],
          ["\\eta", "small additive noise, drawn from a per-element PRNG"],
        ]}
      />

      <Aside heading="Worked example we'll keep coming back to">
        <p>
          Imagine the simplest possible "petal" — a flat rectangle
          1 unit long and 0.2 units wide. Its parametric surface is
        </p>
        <Display>{`\\mathbf{p}(t, u) = \\bigl(\\, (u - 0.5)\\cdot 0.2,\\; 0,\\; t \\,\\bigr)`}</Display>
        <p>
          Sample on an 11 × 5 grid, connect the points with triangles,
          you have a flat ribbon. Every petal in §1 is a deformation of
          exactly this ribbon. We will see what happens when we make
          the width depend on <Tex>{`t`}</Tex>, when we lift the spine,
          when we cup the cross-section. Each step adds one term to one
          of <Tex>{`x, y, z`}</Tex>.
        </p>
      </Aside>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   §1 — The petal
   ─────────────────────────────────────────────────────────────────────── */

const DEFAULT_PETAL: PetalShape = {
  length: 0.6,
  maxWidth: 0.22,
  baseWidth: 0.04,
  tipSharpness: 0.35,
  curl: 0.4,
  bend: 0.5,
  cup: 0.3,
  ruffle: 0,
  twist: 0,
  sideSway: 0,
  edgeWave: 0,
  noiseAmp: 0,
};

function PetalSection() {
  const [p, setP] = useState<PetalShape>(DEFAULT_PETAL);
  const set = <K extends keyof PetalShape>(k: K, v: PetalShape[K]) =>
    setP((prev) => ({ ...prev, [k]: v }));

  return (
    <section className="space-y-10">
      <div>
        <p className="text-xs font-mono uppercase tracking-widest text-emerald-700">
          §1
        </p>
        <h2 className="mt-1 font-instrument text-3xl font-bold">The petal</h2>
      </div>

      <Prose>
        <p>
          We will build a petal as a parametric surface{" "}
          <Tex>{`\\mathbf{p}(t, u)`}</Tex>, the way §0 introduced. By the
          end of this section that surface will look like a real petal,
          with width that tapers, a body that bends, a centre that cups,
          and an edge that ruffles. We get there one term at a time.
        </p>
      </Prose>

      <Aside heading="Symbols used in this section">
        <p>
          Read it once, then refer back. <Tex>{`L`}</Tex> is the petal's
          length in world units; <Tex>{`w_b`}</Tex> and{" "}
          <Tex>{`w_M`}</Tex> are the base and maximum half-widths;{" "}
          <Tex>{`s, c, b, C, R, W_e, \\tau, S`}</Tex> are dimensionless
          knobs the recipes set per species (tip-sharpness, curl, bend,
          cup, ruffle, edge-wave, twist, sway). All of them live in the
          interactive panel at the bottom — drag them and the diagrams
          re-evaluate live.
        </p>
      </Aside>

      <SubHeading>1.1 — Start with a flat ribbon</SubHeading>

      <Prose>
        <p>
          Forget petals for a moment. The dumbest 2D shape we can sweep
          is a constant-width ribbon. Plug{" "}
          <Tex>{`x(t, u) = (u - 0.5)\\cdot 2 w_M`}</Tex>,{" "}
          <Tex>{`y = 0`}</Tex>, <Tex>{`z = L \\cdot t`}</Tex> into the
          parametric surface from §0.4 and you get a flat rectangle in
          the <Tex>{`xz`}</Tex>-plane. That is our zeroth petal — every
          subsequent step is a small modification to one of the three
          coordinate functions.
        </p>
        <p>
          Three properties of this rectangle are wrong: the width is
          uniform (real petals taper), the surface is flat in{" "}
          <Tex>{`y`}</Tex> (real petals lift), and the edges are sharp
          (real petals are rounded near the tip). We fix them in order.
        </p>
      </Prose>

      <SubHeading>1.2 — Width: making a tapered outline</SubHeading>

      <Prose>
        <p>
          Replace the constant width <Tex>{`w_M`}</Tex> with a function{" "}
          <Tex>{`\\operatorname{halfW}(t)`}</Tex> that varies with
          progress. We want it small at the base, large in the middle,
          shrinking to (almost) zero at the tip.
        </p>
        <p>
          Building the function up. Step one: a sine hump,{" "}
          <Tex>{`\\sin(\\pi t)`}</Tex>, is zero at <Tex>{`t = 0`}</Tex>{" "}
          and <Tex>{`t = 1`}</Tex> and peaks at <Tex>{`t = 0.5`}</Tex>.
          That's roughly the right shape, but it's perfectly symmetric —
          a real petal is fatter near the base.
        </p>
        <p>
          Step two: pre-distort the input. The function{" "}
          <Tex>{`\\sin(\\pi t^{0.7})`}</Tex> still hits zero at the
          endpoints, but the exponent <Tex>{`0.7 < 1`}</Tex> stretches
          small <Tex>{`t`}</Tex> and compresses large <Tex>{`t`}</Tex>,
          so the peak shifts toward the base. Below: the two hump
          shapes side by side.
        </p>
      </Prose>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Figure caption="sin(π·t) — symmetric hump, peak at t = 0.5.">
          <Curve1DDemo
            fn={(t) => Math.sin(Math.PI * t)}
            ymin={0}
            ymax={1}
            label={"sin(πt)"}
          />
        </Figure>
        <Figure caption="sin(π·t^0.7) — peak shifted toward the base. The petal will be fuller at the bottom.">
          <Curve1DDemo
            fn={(t) => Math.sin(Math.PI * Math.pow(t, 0.7))}
            ymin={0}
            ymax={1}
            label={"sin(πt^0.7)"}
          />
        </Figure>
      </div>

      <Prose>
        <p>
          Step three: pinch the tip. Multiply by{" "}
          <Tex>{`(1 - s\\, t^{2.5})`}</Tex>. At small <Tex>{`t`}</Tex>{" "}
          this factor is near 1 (no effect); at <Tex>{`t = 1`}</Tex> it
          equals <Tex>{`1 - s`}</Tex>. The exponent <Tex>{`2.5`}</Tex>{" "}
          keeps the factor flat for most of the petal and only kicks in
          right at the tip. <Tex>{`s`}</Tex> controls how sharp the tip
          becomes — an iris has a high <Tex>{`s`}</Tex>, a hydrangea
          petal a low one.
        </p>
        <p>
          Step four: rescale to the actual width. Map the dimensionless
          shape from <Tex>{`[0, 1]`}</Tex> into{" "}
          <Tex>{`[w_b, w_M]`}</Tex>. The full formula:
        </p>
        <Display>{`\\operatorname{halfW}(t) \\;=\\; w_b + (w_M - w_b)\\,\\max\\!\\Bigl(0,\\; \\underbrace{\\sin(\\pi t^{0.7})}_{\\text{shifted hump}}\\,\\underbrace{(1 - s\\, t^{2.5})}_{\\text{tip pinch}}\\Bigr)`}</Display>
        <p>
          The <Tex>{`\\max(0, \\cdot)`}</Tex> just keeps the result
          non-negative when <Tex>{`s > 1`}</Tex> would have driven it
          below zero. Drag the sliders below to see how each part
          contributes.
        </p>
      </Prose>

      <Figure caption="Live half-width profile. Drag baseWidth, maxWidth, tipSharpness in the controls at the bottom.">
        <Curve1DLive p={p} />
      </Figure>

      <SubHeading>1.3 — Spine: lifting the petal off the plane</SubHeading>

      <Prose>
        <p>
          The width gives us an outline; we still need the petal to
          curve up out of its base. We do that by replacing the dead
          line <Tex>{`z = L t,\\, y = 0`}</Tex> with a parametric{" "}
          <em>curve</em> we'll call the <strong>spine</strong>. The
          spine is a curve in the <Tex>{`yz`}</Tex>-plane:
        </p>
        <Display>{`\\bigl( y_s(t),\\, z_s(t) \\bigr)`}</Display>
        <p>that grows in <Tex>{`z`}</Tex> while gently rising in <Tex>{`y`}</Tex>.</p>
        <p>
          The cleanest way to make a curve "rise as it goes" is to draw
          a line of length <Tex>{`L\\, t`}</Tex> from the origin and
          tilt it by some angle <Tex>{`\\theta`}</Tex>. If we tilt by a
          constant we get a straight diagonal, which is fine but boring.
          We make <Tex>{`\\theta`}</Tex> depend on{" "}
          <Tex>{`t`}</Tex> instead, so the curve bends progressively:
        </p>
        <Display>{`\\theta_b(t) = b \\cdot \\frac{\\pi}{4}\\,\\sin(0.6\\pi\\, t)`}</Display>
        <Display>{`y_s(t) = L\\, t\\, \\sin \\theta_b(t), \\quad z_s(t) = L\\, t\\, \\cos \\theta_b(t)`}</Display>
        <p>
          What does <Tex>{`\\theta_b`}</Tex> look like? It starts at
          zero (the petal leaves the base flat), grows to a peak at
          about <Tex>{`t = 0.83`}</Tex>, then comes back down. So the
          spine arches and slightly straightens out near the tip — much
          more organic than a constant tilt. The amplitude{" "}
          <Tex>{`b\\cdot \\pi/4`}</Tex> caps the maximum tilt; with the
          default <Tex>{`b = 0.5`}</Tex> the bend reaches{" "}
          <Tex>{`\\pi/8 = 22.5^\\circ`}</Tex>.
        </p>
      </Prose>

      <Figure caption="Bend angle θ_b(t). The peak arrives near t = 0.83 because of the 0.6π factor.">
        <Curve1DDemo
          fn={(t) => p.bend! * (Math.PI / 4) * Math.sin(0.6 * Math.PI * t)}
          ymin={-Math.PI / 4}
          ymax={Math.PI / 4}
          label={"θ_b(t)"}
        />
      </Figure>

      <Prose>
        <p>
          Finally, the tip itself often curls a little extra — think of
          a tulip's lip turning out, or a daisy ray bending up. We add
          a separate <strong>tip curl</strong> term that only acts near{" "}
          <Tex>{`t = 1`}</Tex>:
        </p>
        <Display>{`y_{\\text{tip}}(t) = c \\cdot t^2 \\cdot 0.45\\, L`}</Display>
        <p>
          The <Tex>{`t^2`}</Tex> is doing all the work here: at{" "}
          <Tex>{`t = 0.5`}</Tex> the term is just <Tex>{`0.25`}</Tex>{" "}
          times its peak value; at <Tex>{`t = 0.9`}</Tex> it's{" "}
          <Tex>{`0.81`}</Tex>. Smaller exponents like <Tex>{`t`}</Tex>{" "}
          would lift the whole spine; bigger ones like{" "}
          <Tex>{`t^4`}</Tex> would only affect the very last samples.
        </p>
      </Prose>

      <Figure caption="Spine viewed from the side. Blue dot = base, green dot = tip. The curl pushes the tip up.">
        <LazyCanvas height={240}>
          <PetalSpineStage petal={p} />
        </LazyCanvas>
      </Figure>

      <SubHeading>1.4 — Cross-section: cupping, rippling, fluttering</SubHeading>

      <Prose>
        <p>
          The spine tells us where the petal goes, the width tells us
          how wide it is. To turn that into a 3D surface, we lay the
          width across the spine: at parameter <Tex>{`t`}</Tex> we sweep{" "}
          <Tex>{`u \\in [0, 1]`}</Tex> across, placing each grid point
          at{" "}
          <Tex>{`x = (u - 0.5)\\cdot 2\\,\\operatorname{halfW}(t)`}</Tex>{" "}
          and the spine's <Tex>{`(y_s, z_s)`}</Tex> in the other two
          axes.
        </p>
        <p>
          That gives us a flat ribbon that bends. Real petals are not
          flat — they cup, ripple, and have wavy edges. Three more
          terms model that.
        </p>
      </Prose>

      <Aside heading="The cup function, term by term">
        <p>
          <Tex>{`\\bigl|u - 0.5\\bigr|`}</Tex> is zero in the centre,{" "}
          <Tex>{`0.5`}</Tex> at the rim. Doubling it gives the canonical
          "0 in the middle, 1 at the edge" shape. Raising to{" "}
          <Tex>{`1.6`}</Tex> makes the transition softer (a smaller
          exponent than 2, so the edge ramps up sooner). Subtract this
          from <Tex>{`1`}</Tex> and it flips: 1 in the centre, 0 at the
          edge. Multiply by{" "}
          <Tex>{`-C\\, \\cdot 0.7\\, \\operatorname{halfW}(t)`}</Tex>{" "}
          and we get a downward bow that's strongest in the middle of
          the petal, tapering to nothing at the edges. The width factor
          ensures wider parts of the petal cup more.
        </p>
      </Aside>

      <Prose>
        <p>The three cross-section terms together:</p>
        <Display>{`\\begin{aligned} y_{\\text{cup}}(u, t) &= -C\\,\\bigl(1 - (2|u-0.5|)^{1.6}\\bigr) \\cdot 0.7\\, \\operatorname{halfW}(t) \\\\ y_{\\text{ruffle}}(u, t) &= 0.03\\, R\\, \\sin(5\\pi u + 9 t) \\\\ y_{\\text{edge}}(u, t) &= 0.08\\, W_e\\, (2|u-0.5|)^2\\, \\sin(3\\pi t + \\sigma) \\end{aligned}`}</Display>
        <p>
          The <strong>ruffle</strong> is a 2D sine: it oscillates
          quickly across the width (<Tex>{`5\\pi u`}</Tex>) and slowly
          along the length (<Tex>{`9 t`}</Tex>). The result reads as
          fine wrinkles on the surface.
        </p>
        <p>
          The <strong>edge wave</strong> is gated by{" "}
          <Tex>{`(2|u-0.5|)^2`}</Tex> — zero in the middle, one at the
          rim — so only the very edge moves. A different per-petal seed{" "}
          <Tex>{`\\sigma`}</Tex> is added to the phase so neighbouring
          petals don't ripple in lockstep.
        </p>
      </Prose>

      <SubHeading>1.5 — Twist and sway</SubHeading>

      <Prose>
        <p>
          Two final transformations spice up the petal once we have its
          cross-section. <strong>Twist</strong> rotates the cross-section
          around the spine point by a <Tex>{`t`}</Tex>-dependent angle:
        </p>
        <Display>{`\\theta_\\tau(t) = \\tau \\cdot \\frac{\\pi}{4}\\, t`}</Display>
        <p>
          The rotation is in the local <Tex>{`xy`}</Tex>-plane,{" "}
          <em>around the spine</em> rather than around the world origin.
          That is bookkeeping: subtract the spine{" "}
          <Tex>{`y_s`}</Tex> before rotating, add it back after.
          Otherwise the petal would orbit the origin as it twisted.
        </p>
        <p>
          <strong>Sway</strong> is a single sideways offset, smooth in{" "}
          <Tex>{`t`}</Tex>:
        </p>
        <Display>{`x_{\\text{sway}}(t) = 0.35\\, S\\, L\\, \\sin(1.4\\pi t)`}</Display>
        <p>
          The frequency <Tex>{`1.4\\pi`}</Tex> is tuned so the sway
          peaks slightly past the middle, then comes back, giving the
          petal a banana profile rather than a snake one.
        </p>
      </Prose>

      <SubHeading>1.6 — Putting the parts together</SubHeading>

      <Prose>
        <p>
          Stack everything. For each grid sample{" "}
          <Tex>{`(t_i, u_j)`}</Tex>, we compute
        </p>
        <Display>{`\\begin{aligned} x_{\\text{local}} &= (u - 0.5)\\cdot 2\\,\\operatorname{halfW}(t) \\\\ y_{\\text{local}} &= y_s(t) + y_{\\text{tip}}(t) + y_{\\text{cup}}(u, t) + y_{\\text{ruffle}}(u, t) + y_{\\text{edge}}(u, t) \\\\ z_{\\text{local}} &= z_s(t) \\end{aligned}`}</Display>
        <p>then apply twist around the spine and sway:</p>
        <Display>{`\\begin{bmatrix} x \\\\ y \\end{bmatrix} = \\begin{bmatrix} \\cos\\theta_\\tau & -\\sin\\theta_\\tau \\\\ \\sin\\theta_\\tau & \\hphantom{-}\\cos\\theta_\\tau \\end{bmatrix} \\begin{bmatrix} x_{\\text{local}} \\\\ y_{\\text{local}} - y_s(t) \\end{bmatrix} + \\begin{bmatrix} x_{\\text{sway}}(t) \\\\ y_s(t) \\end{bmatrix}`}</Display>
        <p>
          The <Tex>{`z`}</Tex> coordinate is unchanged. We have arrived
          at our parametric surface{" "}
          <Tex>{`\\mathbf{p}(t, u) = (x, y, z)`}</Tex>, with every term
          named.
        </p>
      </Prose>

      <SubHeading>1.7 — Sampling and triangulation</SubHeading>

      <Prose>
        <p>
          A parametric surface is a continuous object; a GPU draws
          discrete triangles. We sample <Tex>{`\\mathbf{p}(t, u)`}</Tex>{" "}
          on a regular grid. With <Tex>{`L = 22`}</Tex> length segments
          and <Tex>{`W = 12`}</Tex> width segments we get a 23 × 13 grid
          of vertices.
        </p>
        <p>
          For each grid quad with bottom-left vertex at index{" "}
          <Tex>{`(i, j)`}</Tex>, we name the four corners
        </p>
        <Display>{`a = i(W+1) + j, \\quad b = a + 1, \\quad c = a + (W+1), \\quad d = c + 1`}</Display>
        <p>
          and emit two triangles: <Tex>{`(a, c, b)`}</Tex> and{" "}
          <Tex>{`(b, c, d)`}</Tex>. The total triangle count is{" "}
          <Tex>{`2 L W = 528`}</Tex> per petal. A single rose head can
          have around 50 petals, so a rose is roughly 26 000 triangles —
          modest by GPU standards.
        </p>
      </Prose>

      <SubHeading>1.8 — Coordinate spaces</SubHeading>

      <Prose>
        <p>
          The petal lives in <strong>petal-local space</strong>: base at
          the origin, spine grows along <Tex>{`+\\hat{\\mathbf{z}}`}</Tex>,
          width spans <Tex>{`\\hat{\\mathbf{x}}`}</Tex>, lift goes into{" "}
          <Tex>{`+\\hat{\\mathbf{y}}`}</Tex>. To draw the petal in a
          flower we'll need to move it into{" "}
          <strong>flower-local space</strong> in §2 (rotation around the
          flower's axis, tilt outward, plus a translation to the ring
          position) and finally into <strong>world space</strong> in §7
          (translation to a dome point, orientation aligned to the dome
          normal).
        </p>
        <p>
          Each transition is a rigid transform. The full chain is just
          a product of three matrices applied to the petal-local
          vertex:
        </p>
        <Display>{`\\mathbf{v}_{\\text{world}} \\;=\\; T_{\\text{dome}}\\, R_{\\text{normal}}\\, R_{\\text{layer}}\\, \\mathbf{v}_{\\text{petal-local}}`}</Display>
        <p>
          We will fill in <Tex>{`R_{\\text{layer}}`}</Tex> in §2 and{" "}
          <Tex>{`T_{\\text{dome}}, R_{\\text{normal}}`}</Tex> in §7.
        </p>
      </Prose>

      <SubHeading>1.9 — Construction stages</SubHeading>

      <Prose>
        <p>
          Four wireframes, in the order this section built the petal up.
          Drag the sliders at the bottom of the page and watch how each
          stage reacts.
        </p>
      </Prose>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Figure caption="(a) Raw 23 × 13 parameter grid — what we sample.">
          <LazyCanvas height={240}>
            <PetalGridStage petal={p} shaped={false} />
          </LazyCanvas>
        </Figure>
        <Figure caption="(b) After applying halfW(t) — flat lobe, no spine yet.">
          <LazyCanvas height={240}>
            <PetalGridStage petal={p} shaped={true} />
          </LazyCanvas>
        </Figure>
        <Figure caption="(c) Spine alone with tip curl — no width, no cross-section.">
          <LazyCanvas height={240}>
            <PetalSpineStage petal={p} />
          </LazyCanvas>
        </Figure>
        <Figure caption="(d) Final petal mesh, wireframe — width swept along spine plus cup, ruffle, twist.">
          <LazyCanvas height={240}>
            <PetalScene petal={p} wireframe />
          </LazyCanvas>
        </Figure>
      </div>

      <SubHeading>1.10 — Live render</SubHeading>

      <Figure caption="The same petal, shaded with the production riso material.">
        <LazyCanvas height={360}>
          <PetalScene petal={p} />
        </LazyCanvas>
      </Figure>

      <PetalControls p={p} set={set} />
    </section>
  );
}

/** Live half-width profile that responds to the petal sliders. */
function Curve1DLive({ p }: { p: PetalShape }) {
  const fn = (t: number) => {
    const w =
      Math.sin(Math.pow(t, 0.7) * Math.PI) *
      (1 - p.tipSharpness * Math.pow(t, 2.5));
    return p.baseWidth + (p.maxWidth - p.baseWidth) * Math.max(0, w);
  };
  return (
    <Curve1DDemo
      fn={fn}
      ymin={0}
      ymax={Math.max(0.05, p.maxWidth * 1.1)}
      label={"halfW(t)"}
    />
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   3D scene: a single petal rendered with the production riso material
   ─────────────────────────────────────────────────────────────────────── */

function PetalScene({
  petal,
  wireframe = false,
}: {
  petal: PetalShape;
  wireframe?: boolean;
}) {
  const geometry = useMemo(() => petalGeometry(petal), [petal]);
  const material = useMemo(() => {
    if (wireframe) {
      return new MeshBasicMaterial({
        color: "#9d174d",
        wireframe: true,
      });
    }
    const palette = getFlowerPalette("rose");
    return createRisoPetalMaterial({
      baseColor: "#ff6b88",
      palette,
      doubleSide: true,
    });
  }, [wireframe]);

  // Centre the petal within the viewport.
  const centre = useMemo(() => {
    geometry.computeBoundingBox();
    const bb = geometry.boundingBox;
    if (!bb) return new Vector3();
    return new Vector3(
      (bb.min.x + bb.max.x) / 2,
      (bb.min.y + bb.max.y) / 2,
      (bb.min.z + bb.max.z) / 2,
    );
  }, [geometry]);

  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={[1.2, 0.9, 1.6]}
        fov={32}
        near={0.05}
        far={20}
      />
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 5, 4]} intensity={1.0} />
      <group position={[-centre.x, -centre.y, -centre.z]}>
        <mesh geometry={geometry} material={material} />
      </group>
      <OrbitControls
        target={[0, 0, 0]}
        enablePan={false}
        minDistance={0.6}
        maxDistance={6}
      />
    </>
  );
}

/* ─── Petal construction stages (each shown as a wireframe). ─────────── */

/** Stage 1: flat parameter grid — same width vs no width. */
function PetalGridStage({
  petal,
  shaped,
}: {
  petal: PetalShape;
  shaped: boolean;
}) {
  const segs = 22;
  const wsegs = 12;
  // Build a flat grid in the xz plane. If shaped=true apply petalWidthAt;
  // otherwise it's a uniform rectangle (so you see the topology).
  const positions = useMemo(() => {
    const pos: number[] = [];
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const halfW = shaped
        ? petalWidthAtLocal(t, petal.baseWidth, petal.maxWidth, petal.tipSharpness)
        : 0.18;
      for (let j = 0; j <= wsegs; j++) {
        const u = j / wsegs;
        const x = (u - 0.5) * 2 * halfW;
        const z = t * petal.length;
        pos.push(x, 0, z);
      }
    }
    return new Float32Array(pos);
  }, [petal, shaped]);

  const indices = useMemo(() => {
    const idx: number[] = [];
    for (let i = 0; i < segs; i++) {
      for (let j = 0; j < wsegs; j++) {
        const a = i * (wsegs + 1) + j;
        const b = a + 1;
        const c = a + (wsegs + 1);
        const d = c + 1;
        idx.push(a, c, b, b, c, d);
      }
    }
    return idx;
  }, []);

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0.9, 0.55]} fov={32} />
      <ambientLight intensity={0.9} />
      <mesh>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
          <bufferAttribute attach="index" args={[new Uint16Array(indices), 1]} />
        </bufferGeometry>
        <meshBasicMaterial color="#9d174d" wireframe />
      </mesh>
      <OrbitControls enablePan={false} minDistance={0.4} maxDistance={3} />
    </>
  );
}

/** Stage 2: only the spine curve, drawn in 3D as a tube. */
function PetalSpineStage({ petal }: { petal: PetalShape }) {
  const curvePts = useMemo(() => {
    const pts: Vector3[] = [];
    const N = 60;
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const bendAngle = (petal.bend ?? 0) * Math.PI * 0.45 * Math.sin(t * Math.PI * 0.6);
      const py = Math.sin(bendAngle) * petal.length * t;
      const pzCenter = Math.cos(bendAngle) * petal.length * t;
      const tipCurl = (petal.curl ?? 0) * t * t * petal.length * 0.45;
      pts.push(new Vector3(0, py + tipCurl, pzCenter));
    }
    return pts;
  }, [petal]);

  return (
    <>
      <PerspectiveCamera makeDefault position={[0.6, 0.5, 0.7]} fov={32} />
      <ambientLight intensity={0.9} />
      <SpineLine points={curvePts} />
      {/* Mark base and tip */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.012, 12, 12]} />
        <meshBasicMaterial color="#1d4ed8" />
      </mesh>
      <mesh
        position={[
          curvePts[curvePts.length - 1].x,
          curvePts[curvePts.length - 1].y,
          curvePts[curvePts.length - 1].z,
        ]}
      >
        <sphereGeometry args={[0.012, 12, 12]} />
        <meshBasicMaterial color="#059669" />
      </mesh>
      <OrbitControls enablePan={false} minDistance={0.3} maxDistance={3} />
    </>
  );
}

/** A simple line through Vector3 points. */
function SpineLine({ points }: { points: Vector3[] }) {
  const geometry = useMemo(() => {
    const flat = new Float32Array(points.length * 3);
    points.forEach((p, i) => {
      flat[i * 3] = p.x;
      flat[i * 3 + 1] = p.y;
      flat[i * 3 + 2] = p.z;
    });
    return flat;
  }, [points]);
  return (
    <line>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[geometry, 3]} />
      </bufferGeometry>
      <lineBasicMaterial color="#1d4ed8" linewidth={2} />
    </line>
  );
}

/** Local helper mirroring petalWidthAt() so we don't import an internal. */
function petalWidthAtLocal(
  t: number,
  baseWidth: number,
  maxWidth: number,
  tipSharpness: number,
) {
  const w =
    Math.sin(Math.pow(t, 0.7) * Math.PI) *
    (1 - tipSharpness * Math.pow(t, 2.5));
  return baseWidth + (maxWidth - baseWidth) * Math.max(0, w);
}

/* ──────────────────────────────────────────────────────────────────────────
   LazyCanvas: only mounts <Canvas> when in viewport
   ─────────────────────────────────────────────────────────────────────── */

function LazyCanvas({
  children,
  height,
}: {
  children: ReactNode;
  height: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          // Mount on intersect; once mounted we keep it mounted to preserve
          // canvas state. This is good enough for an essay-style page.
          if (entry.isIntersecting) {
            setActive(true);
            observer.disconnect();
            return;
          }
        }
      },
      { rootMargin: "200px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="rounded-xl bg-neutral-100 border border-neutral-200 overflow-hidden"
      style={{ height }}
    >
      {active ? (
        <Canvas
          frameloop="demand"
          gl={{ preserveDrawingBuffer: false, antialias: true }}
          style={{ width: "100%", height: "100%", background: "#fafaf7" }}
        >
          {children}
        </Canvas>
      ) : (
        <div className="w-full h-full grid place-items-center text-xs font-mono text-neutral-400">
          render mounts on scroll
        </div>
      )}
    </div>
  );
}

/* Avoid an unused-import lint when we add Mesh later. */
void Mesh;

/* ──────────────────────────────────────────────────────────────────────────
   Controls
   ─────────────────────────────────────────────────────────────────────── */

function PetalControls({
  p,
  set,
}: {
  p: PetalShape;
  set: <K extends keyof PetalShape>(k: K, v: PetalShape[K]) => void;
}) {
  return (
    <div className="rounded-2xl bg-white border border-neutral-200 p-5 space-y-3">
      <p className="text-xs font-mono uppercase tracking-widest text-neutral-500">
        parameters
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
        <Slider label="length" v={p.length} min={0.1} max={1.2} step={0.01} onChange={(v) => set("length", v)} />
        <Slider label="maxWidth" v={p.maxWidth} min={0.02} max={0.5} step={0.01} onChange={(v) => set("maxWidth", v)} />
        <Slider label="baseWidth" v={p.baseWidth} min={0.005} max={0.15} step={0.005} onChange={(v) => set("baseWidth", v)} />
        <Slider label="tipSharpness" v={p.tipSharpness} min={0} max={1} step={0.02} onChange={(v) => set("tipSharpness", v)} />
        <Slider label="curl" v={p.curl ?? 0} min={-1} max={1.5} step={0.02} onChange={(v) => set("curl", v)} />
        <Slider label="bend" v={p.bend ?? 0} min={0} max={1.5} step={0.02} onChange={(v) => set("bend", v)} />
        <Slider label="cup" v={p.cup ?? 0} min={-0.6} max={1.0} step={0.02} onChange={(v) => set("cup", v)} />
        <Slider label="ruffle" v={p.ruffle ?? 0} min={0} max={1.5} step={0.02} onChange={(v) => set("ruffle", v)} />
        <Slider label="twist" v={p.twist ?? 0} min={-1.2} max={1.2} step={0.02} onChange={(v) => set("twist", v)} />
        <Slider label="sideSway" v={p.sideSway ?? 0} min={-0.5} max={0.5} step={0.02} onChange={(v) => set("sideSway", v)} />
        <Slider label="edgeWave" v={p.edgeWave ?? 0} min={0} max={1.5} step={0.02} onChange={(v) => set("edgeWave", v)} />
      </div>
    </div>
  );
}

function Slider({
  label,
  v,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  v: number;
  min: number;
  max: number;
  step: number;
  onChange: (next: number) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-xs">
      <span className="flex-1 text-neutral-700 truncate">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={v}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-32 accent-neutral-950"
      />
      <span className="w-12 text-right tabular-nums text-neutral-600">
        {v.toFixed(2)}
      </span>
    </label>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Layout / typography primitives
   ─────────────────────────────────────────────────────────────────────── */

function Prose({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-4 text-[15.5px] leading-7 text-neutral-800
                    [&_em]:italic [&_strong]:font-semibold
                    [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1.5">
      {children}
    </div>
  );
}

function SubHeading({ children }: { children: ReactNode }) {
  return (
    <h3 className="mt-10 font-instrument text-2xl font-bold text-neutral-900">
      {children}
    </h3>
  );
}

function Figure({
  caption,
  children,
}: {
  caption: string;
  children: ReactNode;
}) {
  return (
    <figure className="space-y-2">
      {children}
      <figcaption className="text-xs text-neutral-500 italic">
        {caption}
      </figcaption>
    </figure>
  );
}

/** Inline italic variable, no MathJax. Use for short symbols / English
 * sentences that include a couple of Unicode-friendly variables. */
function V({ children }: { children: ReactNode }) {
  return <span className="font-serif italic">{children}</span>;
}

/** Inline LaTeX. Pass raw LaTeX without delimiters. */
function Tex({ children }: { children: string }) {
  return (
    <MathJax inline dynamic>
      {`\\(${children}\\)`}
    </MathJax>
  );
}

/** Display LaTeX block. Pass raw LaTeX without delimiters. */
function Display({ children }: { children: string }) {
  return (
    <div className="my-2 px-4 py-3 bg-neutral-100 border-l-2 border-neutral-300 rounded-r-md overflow-x-auto">
      <MathJax dynamic>{`\\[${children}\\]`}</MathJax>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Pedagogy primitives: Aside, SymbolTable, small SVG demos
   ─────────────────────────────────────────────────────────────────────── */

function Aside({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  return (
    <div className="my-6 rounded-xl bg-emerald-50/70 border border-emerald-200 p-5 space-y-3">
      <p className="text-xs font-mono uppercase tracking-widest text-emerald-800">
        {heading}
      </p>
      <div className="space-y-3 text-[15px] leading-7 text-emerald-950">
        {children}
      </div>
    </div>
  );
}

function SymbolTable({ rows }: { rows: [string, string][] }) {
  return (
    <div className="my-3 rounded-xl border border-neutral-200 bg-white overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="bg-neutral-100 text-xs font-mono uppercase tracking-widest text-neutral-500">
          <tr>
            <th className="px-4 py-2 w-1/3">symbol</th>
            <th className="px-4 py-2">meaning</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([sym, meaning], i) => (
            <tr key={i} className="border-t border-neutral-200">
              <td className="px-4 py-2 align-top">
                <Tex>{sym}</Tex>
              </td>
              <td className="px-4 py-2 text-neutral-700">{meaning}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Plot of a 1D function f: [0,1] → R, with a draggable t marker. */
function Curve1DDemo({
  fn,
  ymin,
  ymax,
  label,
}: {
  fn: (t: number) => number;
  ymin: number;
  ymax: number;
  label: string;
}) {
  const [t, setT] = useState(0.4);
  const W = 480;
  const H = 220;
  const padX = 40;
  const padY = 24;
  const N = 80;
  const points = Array.from({ length: N + 1 }, (_, i) => i / N);
  const tx = (s: number) => padX + s * (W - padX * 2);
  const ty = (v: number) =>
    padY + (1 - (v - ymin) / (ymax - ymin)) * (H - padY * 2);

  const path = points
    .map((s, i) => `${i === 0 ? "M" : "L"} ${tx(s)} ${ty(fn(s))}`)
    .join(" ");

  return (
    <div className="rounded-xl bg-neutral-100 border border-neutral-200 overflow-hidden p-4 space-y-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {/* axes */}
        <line x1={padX} y1={ty(ymin)} x2={W - padX} y2={ty(ymin)} stroke="#a3a3a3" />
        <line x1={padX} y1={padY} x2={padX} y2={H - padY} stroke="#a3a3a3" />
        {/* curve */}
        <path d={path} stroke="#1d4ed8" strokeWidth={2} fill="none" />
        {/* marker */}
        <line
          x1={tx(t)}
          y1={padY}
          x2={tx(t)}
          y2={H - padY}
          stroke="#dc2626"
          strokeDasharray="4 4"
        />
        <circle cx={tx(t)} cy={ty(fn(t))} r={5} fill="#dc2626" />
        <text x={padX} y={H - 4} fontSize={11} fontFamily="monospace" fill="#737373">
          t = 0
        </text>
        <text
          x={W - padX}
          y={H - 4}
          fontSize={11}
          fontFamily="monospace"
          fill="#737373"
          textAnchor="end"
        >
          t = 1
        </text>
        <text x={6} y={padY + 10} fontSize={11} fontFamily="monospace" fill="#737373">
          {label}
        </text>
      </svg>
      <div className="flex items-center gap-3 text-xs">
        <span className="text-neutral-700">t</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.005}
          value={t}
          onChange={(e) => setT(Number(e.target.value))}
          className="flex-1 accent-neutral-950"
        />
        <span className="tabular-nums text-neutral-600 w-12 text-right">
          {t.toFixed(2)}
        </span>
        <span className="text-neutral-500 ml-2">f(t) = {fn(t).toFixed(3)}</span>
      </div>
    </div>
  );
}

/** Live 3D helix as an example of a parametric curve. */
function Curve3DDemo() {
  const [t, setT] = useState(0.5);

  const points = useMemo(() => {
    const N = 80;
    const pts: Vector3[] = [];
    for (let i = 0; i <= N; i++) {
      const s = i / N;
      pts.push(
        new Vector3(Math.sin(2 * Math.PI * s), s, Math.cos(2 * Math.PI * s)),
      );
    }
    return pts;
  }, []);

  const head = new Vector3(
    Math.sin(2 * Math.PI * t),
    t,
    Math.cos(2 * Math.PI * t),
  );

  return (
    <div className="rounded-xl bg-neutral-100 border border-neutral-200 overflow-hidden">
      <div style={{ height: 260 }}>
        <LazyCanvas height={260}>
          <PerspectiveCamera makeDefault position={[2.4, 1.2, 2.4]} fov={36} />
          <ambientLight intensity={0.9} />
          <SpineLine points={points} />
          <mesh position={[head.x, head.y, head.z]}>
            <sphereGeometry args={[0.04, 12, 12]} />
            <meshBasicMaterial color="#dc2626" />
          </mesh>
          <OrbitControls enablePan={false} minDistance={1} maxDistance={6} />
        </LazyCanvas>
      </div>
      <div className="p-3 flex items-center gap-3 text-xs">
        <span className="text-neutral-700">t</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.005}
          value={t}
          onChange={(e) => setT(Number(e.target.value))}
          className="flex-1 accent-neutral-950"
        />
        <span className="tabular-nums text-neutral-600 w-12 text-right">
          {t.toFixed(2)}
        </span>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   §2 — The petal layer
   ─────────────────────────────────────────────────────────────────────── */

type LayerParams = {
  count: number;
  ringRadius: number;
  tilt: number;
  twist: number;
  rollPhase: number;
  yOffset: number;
};

const DEFAULT_LAYER: LayerParams = {
  count: 12,
  ringRadius: 0.18,
  tilt: -0.6,
  twist: 0.4,
  rollPhase: 0,
  yOffset: 0,
};

function PetalLayerSection() {
  const [L, setL] = useState<LayerParams>(DEFAULT_LAYER);
  const set = <K extends keyof LayerParams>(k: K, v: LayerParams[K]) =>
    setL((prev) => ({ ...prev, [k]: v }));

  return (
    <section className="space-y-10 mt-24">
      <SectionHeader index="§2" title="The petal layer" />

      <Prose>
        <p>
          A flower head is built from one or more concentric{" "}
          <strong>layers</strong>. Each layer is a thin annular shell of
          identical petals, parameterised by{" "}
          <Tex>{`(n, r, y_0, \\alpha, \\tau, \\varphi)`}</Tex>: a count, a
          ring radius, a height, an outward tilt, a per-petal twist, and a
          phase. The shape of the petal itself comes from §1; the layer
          decides how many copies and where to put them.
        </p>
      </Prose>

      <SubHeading>2.1 — Ring placement</SubHeading>

      <Prose>
        <p>
          The angular position of petal <Tex>{`k`}</Tex> is uniform on the
          circle, with a phase offset:
        </p>
        <Display>{`\\theta_k = \\varphi + \\frac{2\\pi k}{n}, \\qquad k = 0, 1, \\ldots, n-1`}</Display>
        <p>The cartesian position in the flower-local frame is</p>
        <Display>{`\\mathbf{x}_k = \\bigl( r \\cos \\theta_k,\\; y_0,\\; r \\sin \\theta_k \\bigr)`}</Display>
        <p>
          The phase <Tex>{`\\varphi`}</Tex> matters because adjacent layers
          should not align — if every layer fires petals at the same{" "}
          <Tex>{`\\theta_k`}</Tex>, gaps appear in the rendered profile. By
          giving each layer a different <Tex>{`\\varphi`}</Tex> the petals
          stagger like brick courses.
        </p>
      </Prose>

      <SubHeading>2.2 — Per-petal orientation</SubHeading>

      <Prose>
        <p>
          Each petal also needs a rotation. Three rotations compose, applied
          in order (right-to-left in matrix form):
        </p>
        <Display>{`R_k \\;=\\; R_y(-\\theta_k + \\tau \\tfrac{k}{n}) \\,\\cdot\\, R_x(\\alpha)`}</Display>
        <p>
          Reading from the right: <Tex>{`R_x(\\alpha)`}</Tex> tilts the
          petal up by the layer's tilt angle, then{" "}
          <Tex>{`R_y(-\\theta_k + \\tau k/n)`}</Tex> spins it around the
          flower's axis so its base faces outward and adds a per-petal
          twist that grows linearly with <Tex>{`k`}</Tex>. The minus on{" "}
          <Tex>{`\\theta_k`}</Tex> is bookkeeping: in the petal's local
          frame the spine grows along <Tex>{`+\\hat{\\mathbf{z}}`}</Tex>,
          but at angle <Tex>{`\\theta_k`}</Tex> the outward direction in
          world frame is <Tex>{`(\\cos\\theta_k, 0, \\sin\\theta_k)`}</Tex>.
        </p>
        <p>
          The full transform for vertex <Tex>{`\\mathbf{v}`}</Tex> of petal{" "}
          <Tex>{`k`}</Tex> is
        </p>
        <Display>{`\\mathbf{v}_{\\text{flower}} = \\mathbf{x}_k + R_k\\, \\mathbf{v}_{\\text{petal-local}}`}</Display>
        <p>
          which is exactly four floating-point multiplies and three adds per
          axis, plus the rotation. Cheap: a layer of 30 petals composes to
          one matrix multiplication per petal — the same petal mesh is
          reused, only its transform differs.
        </p>
      </Prose>

      <SubHeading>2.3 — Layer stack as a recipe</SubHeading>

      <Prose>
        <p>
          Real flowers have several layers with growing radius and changing
          tilt. The rose recipe, for example, uses five layers indexed by{" "}
          <Tex>{`i \\in [0, 5)`}</Tex>, where each layer's parameters are
          linear in <Tex>{`i`}</Tex>:
        </p>
        <Display>{`\\begin{aligned} r(i) &= r_0 + \\Delta r \\cdot i \\\\ \\alpha(i) &= \\alpha_0 + \\Delta \\alpha \\cdot i \\\\ n(i) &= n_0 + \\Delta n \\cdot i \\\\ y_0(i) &= y_0^{\\,0} - \\Delta y \\cdot i \\end{aligned}`}</Display>
        <p>
          For a rose, <Tex>{`(r_0, \\Delta r) = (0.05, 0.07)`}</Tex>,{" "}
          <Tex>{`(\\alpha_0, \\Delta\\alpha) = (-1.1, 0.18)`}</Tex>,{" "}
          <Tex>{`(n_0, \\Delta n) = (8, 2)`}</Tex>. The radius grows so
          outer petals reach further out; the tilt grows from <Tex>{`-1.1`}</Tex>{" "}
          (almost vertical, hugging the centre) toward <Tex>{`-0.2`}</Tex>{" "}
          (nearly flat, opening outward); the count grows so density stays
          roughly constant despite the larger circumference. The result is
          a smooth bowl that gradually flattens out.
        </p>
        <p>
          Different species use different parameter trajectories. A
          sunflower has one tall layer of <Tex>{`n = 28`}</Tex> long petals
          at large <Tex>{`r`}</Tex>; a daisy has just two layers of
          mid-length petals at fairly flat tilt; a peony has six layers
          piled high with high petal counts and aggressive growth in{" "}
          <Tex>{`r`}</Tex>.
        </p>
      </Prose>

      <SubHeading>2.4 — Layer construction stages</SubHeading>

      <Prose>
        <p>
          The wireframes below show the layer at three points: just the
          ring positions, the ring with placement axes drawn at each
          slot, and the full layer with petal meshes attached.
        </p>
      </Prose>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Figure caption="(a) The bare ring of placements (one dot per petal).">
          <LazyCanvas height={260}>
            <LayerRingStage layer={L} />
          </LazyCanvas>
        </Figure>
        <Figure caption="(b) Each placement with its outward axis (red) and tilt axis (green).">
          <LazyCanvas height={260}>
            <LayerAxesStage layer={L} />
          </LazyCanvas>
        </Figure>
        <Figure caption="(c) Petal meshes attached at each slot, drawn as wireframes.">
          <LazyCanvas height={260}>
            <PetalLayerScene layer={L} wireframe />
          </LazyCanvas>
        </Figure>
        <Figure caption="(d) Same layer, shaded.">
          <LazyCanvas height={260}>
            <PetalLayerScene layer={L} />
          </LazyCanvas>
        </Figure>
      </div>

      <div className="rounded-2xl bg-white border border-neutral-200 p-5 space-y-3">
        <p className="text-xs font-mono uppercase tracking-widest text-neutral-500">
          parameters
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
          <Slider label="count" v={L.count} min={3} max={36} step={1} onChange={(v) => set("count", v)} />
          <Slider label="ringRadius" v={L.ringRadius} min={0.02} max={0.6} step={0.01} onChange={(v) => set("ringRadius", v)} />
          <Slider label="tilt (rad)" v={L.tilt} min={-1.5} max={1.0} step={0.02} onChange={(v) => set("tilt", v)} />
          <Slider label="twist" v={L.twist} min={-1.5} max={1.5} step={0.02} onChange={(v) => set("twist", v)} />
          <Slider label="rollPhase" v={L.rollPhase} min={0} max={Math.PI * 2} step={0.05} onChange={(v) => set("rollPhase", v)} />
          <Slider label="yOffset" v={L.yOffset} min={-0.3} max={0.3} step={0.01} onChange={(v) => set("yOffset", v)} />
        </div>
      </div>
    </section>
  );
}

function PetalLayerScene({
  layer,
  wireframe = false,
}: {
  layer: LayerParams;
  wireframe?: boolean;
}) {
  const petalShape: PetalShape = {
    length: 0.42,
    maxWidth: 0.22,
    baseWidth: 0.04,
    tipSharpness: 0.4,
    curl: 0.25,
    bend: 0.5,
    cup: 0.3,
  };
  const geometry = useMemo(() => petalGeometry(petalShape), []);
  const palette = useMemo(() => getFlowerPalette("rose"), []);
  const materials = useMemo(() => {
    if (wireframe) {
      return Array.from(
        { length: layer.count },
        () => new MeshBasicMaterial({ color: "#9d174d", wireframe: true }),
      );
    }
    return Array.from({ length: layer.count }, () =>
      createRisoPetalMaterial({
        baseColor: "#ff6b88",
        palette,
        doubleSide: true,
      }),
    );
  }, [layer.count, palette, wireframe]);

  const positions = useMemo(
    () => ringPositions(layer.count, layer.ringRadius, layer.rollPhase),
    [layer.count, layer.ringRadius, layer.rollPhase],
  );

  return (
    <>
      <PerspectiveCamera makeDefault position={[1.4, 1.2, 1.4]} fov={36} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 5, 4]} intensity={1.0} />
      <group position={[0, layer.yOffset, 0]}>
        {positions.map(({ x, z, angle }, i) => {
          const twist = layer.twist * (i / layer.count);
          return (
            <mesh
              key={i}
              geometry={geometry}
              material={materials[i]}
              position={[x, 0, z]}
              rotation={[layer.tilt, -angle + twist, 0]}
            />
          );
        })}
      </group>
      <OrbitControls enablePan={false} minDistance={0.6} maxDistance={6} />
    </>
  );
}

/** Stage (a): just placement points on a circle. */
function LayerRingStage({ layer }: { layer: LayerParams }) {
  const positions = useMemo(
    () => ringPositions(layer.count, layer.ringRadius, layer.rollPhase),
    [layer.count, layer.ringRadius, layer.rollPhase],
  );
  // Build a thin ring outline.
  const ringPts = useMemo(() => {
    const N = 96;
    const pts: Vector3[] = [];
    for (let i = 0; i <= N; i++) {
      const a = (i / N) * Math.PI * 2;
      pts.push(
        new Vector3(
          Math.cos(a) * layer.ringRadius,
          layer.yOffset,
          Math.sin(a) * layer.ringRadius,
        ),
      );
    }
    return pts;
  }, [layer.ringRadius, layer.yOffset]);
  return (
    <>
      <PerspectiveCamera makeDefault position={[1.0, 0.9, 1.0]} fov={36} />
      <ambientLight intensity={0.9} />
      <SpineLine points={ringPts} />
      {positions.map(({ x, z }, i) => (
        <mesh key={i} position={[x, layer.yOffset, z]}>
          <sphereGeometry args={[0.012, 12, 12]} />
          <meshBasicMaterial color="#9d174d" />
        </mesh>
      ))}
      <OrbitControls enablePan={false} minDistance={0.4} maxDistance={4} />
    </>
  );
}

/** Stage (b): each placement with its outward and tilt axes. */
function LayerAxesStage({ layer }: { layer: LayerParams }) {
  const positions = useMemo(
    () => ringPositions(layer.count, layer.ringRadius, layer.rollPhase),
    [layer.count, layer.ringRadius, layer.rollPhase],
  );
  return (
    <>
      <PerspectiveCamera makeDefault position={[1.0, 0.9, 1.0]} fov={36} />
      <ambientLight intensity={0.9} />
      {positions.map(({ x, z, angle }, i) => {
        const outward = new Vector3(Math.cos(angle), 0, Math.sin(angle));
        const tip = outward.clone().multiplyScalar(0.18);
        // tilt axis: rotate outward by tilt around the in-plane perpendicular
        const perp = new Vector3(-Math.sin(angle), 0, Math.cos(angle));
        void perp;
        const tilted = new Vector3(
          outward.x * Math.cos(layer.tilt),
          Math.sin(-layer.tilt),
          outward.z * Math.cos(layer.tilt),
        ).multiplyScalar(0.22);
        return (
          <group key={i} position={[x, layer.yOffset, z]}>
            <SpineLine
              points={[new Vector3(0, 0, 0), tip]}
            />
            <SpineLine
              points={[new Vector3(0, 0, 0), tilted]}
            />
            <mesh>
              <sphereGeometry args={[0.01, 8, 8]} />
              <meshBasicMaterial color="#9d174d" />
            </mesh>
          </group>
        );
      })}
      <OrbitControls enablePan={false} minDistance={0.4} maxDistance={4} />
    </>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   §3 — The flower center (phyllotaxis)
   ─────────────────────────────────────────────────────────────────────── */

function FlowerCenterSection() {
  const [n, setN] = useState(60);
  const [spacing, setSpacing] = useState(0.04);

  return (
    <section className="space-y-10 mt-24">
      <SectionHeader index="§3" title="The flower center" />

      <Prose>
        <p>
          The disc at the centre of a sunflower or daisy is filled by points
          on a <strong>Vogel spiral</strong>, a discrete approximation of
          the continuous arrangement found in real flower heads.
        </p>
      </Prose>

      <SubHeading>3.1 — Vogel's parameterisation</SubHeading>

      <Prose>
        <p>
          The <Tex>{`k`}</Tex>-th point is placed at angle and radius
        </p>
        <Display>{`\\theta_k = k \\cdot \\psi, \\qquad r_k = c\\,\\sqrt{k}`}</Display>
        <p>
          where <Tex>{`\\psi = \\pi(3 - \\sqrt{5}) \\approx 137.5077^\\circ`}</Tex>{" "}
          is the <strong>golden angle</strong> and <Tex>{`c`}</Tex> is the
          radial spacing. In Cartesian coordinates,
        </p>
        <Display>{`\\bigl(x_k, z_k\\bigr) = r_k\\,\\bigl(\\cos\\theta_k,\\, \\sin\\theta_k\\bigr)`}</Display>
        <p>
          Two facts make this parameterisation special.
        </p>
        <ul>
          <li>
            <strong>Uniform area density.</strong> Because{" "}
            <Tex>{`r_k \\propto \\sqrt{k}`}</Tex>, the number of seeds within
            a disc of radius <Tex>{`R`}</Tex> is{" "}
            <Tex>{`N(R) = (R/c)^2`}</Tex>: quadratic in radius, just like
            the area of the disc. Each seed occupies an annular slot of
            roughly equal area to all the others, so density does not
            change with <Tex>{`r`}</Tex>.
          </li>
          <li>
            <strong>The golden angle is the worst rational approximation.</strong>{" "}
            For any irrational <Tex>{`\\psi/(2\\pi)`}</Tex> the sequence{" "}
            <Tex>{`\\{k\\psi \\bmod 2\\pi\\}`}</Tex> never repeats; but
            for <em>most</em> irrationals it still has near-resonances
            ({`p/q ≈ \\psi/(2\\pi)`}) that line up the seeds into spokes.
            The golden ratio <Tex>{`\\phi = (1 + \\sqrt 5)/2`}</Tex> has
            the slowest-converging continued fraction expansion (all
            ones), so its rotation produces the most uniform angular
            distribution achievable. The spiral arms a viewer perceives
            in a sunflower disc are then consecutive Fibonacci numbers —
            those are the rational approximations to <Tex>{`\\phi`}</Tex>.
          </li>
        </ul>
      </Prose>

      <SubHeading>3.2 — Counting the spirals</SubHeading>

      <Prose>
        <p>
          Pick any seed, look at its nearest neighbours, and trace the
          smooth curves through them — those are the parastichies. Their
          counts are always two consecutive Fibonacci numbers{" "}
          <Tex>{`(F_n, F_{n+1})`}</Tex>: e.g. 21 clockwise and 34
          counter-clockwise on a typical sunflower. The number of arms
          you see grows with <Tex>{`k`}</Tex>: you'd start by seeing
          (3, 5), then (5, 8), then (8, 13) as the disc gets denser. This
          is purely a consequence of the convergents of <Tex>{`\\phi`}</Tex>.
        </p>
      </Prose>

      <SubHeading>3.3 — Pseudo-code</SubHeading>

      <Prose>
        <p>The implementation is six lines:</p>
        <Display>{`\\begin{aligned} &\\textbf{for } k = 1, 2, \\ldots, N \\textbf{ do} \\\\ &\\quad \\theta \\leftarrow k \\cdot \\psi \\\\ &\\quad r \\leftarrow c \\cdot \\sqrt{k} \\\\ &\\quad x \\leftarrow r\\cos\\theta,\\; z \\leftarrow r\\sin\\theta \\\\ &\\quad \\textit{emit}(x, z) \\\\ &\\textbf{end for} \\end{aligned}`}</Display>
        <p>
          That's the entire centre of every sunflower, daisy and
          chrysanthemum on the page.
        </p>
      </Prose>

      <SubHeading>3.4 — Construction stages</SubHeading>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Figure caption="(a) The seed positions only — no surface yet.">
          <LazyCanvas height={260}>
            <PhyllotaxisStage count={n} spacing={spacing} mode="dots" />
          </LazyCanvas>
        </Figure>
        <Figure caption="(b) Connect each seed to k+1 to expose the underlying spiral.">
          <LazyCanvas height={260}>
            <PhyllotaxisStage count={n} spacing={spacing} mode="spiral" />
          </LazyCanvas>
        </Figure>
        <Figure caption="(c) Disc + seed spheres, wireframe.">
          <LazyCanvas height={260}>
            <PhyllotaxisScene count={n} spacing={spacing} wireframe />
          </LazyCanvas>
        </Figure>
        <Figure caption="(d) Final flower centre, shaded.">
          <LazyCanvas height={260}>
            <PhyllotaxisScene count={n} spacing={spacing} />
          </LazyCanvas>
        </Figure>
      </div>

      <div className="rounded-2xl bg-white border border-neutral-200 p-5 space-y-3">
        <p className="text-xs font-mono uppercase tracking-widest text-neutral-500">
          parameters
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
          <Slider label="count" v={n} min={5} max={400} step={1} onChange={setN} />
          <Slider label="spacing" v={spacing} min={0.005} max={0.1} step={0.001} onChange={setSpacing} />
        </div>
      </div>
    </section>
  );
}

function PhyllotaxisScene({
  count,
  spacing,
  wireframe = false,
}: {
  count: number;
  spacing: number;
  wireframe?: boolean;
}) {
  const seeds = useMemo(() => phyllotaxisDisc(count, spacing), [count, spacing]);
  const seedColor = "#5a3a1a";
  const palette = useMemo(() => getFlowerPalette("sunflower"), []);
  const seedMat = useMemo(
    () =>
      wireframe
        ? new MeshBasicMaterial({ color: "#5a3a1a", wireframe: true })
        : createRisoPetalMaterial({
            baseColor: seedColor,
            palette,
            doubleSide: false,
          }),
    [palette, wireframe],
  );
  const discMat = useMemo(
    () =>
      wireframe
        ? new MeshBasicMaterial({ color: "#a36a25", wireframe: true })
        : createRisoPetalMaterial({
            baseColor: "#a36a25",
            palette,
            doubleSide: false,
          }),
    [palette, wireframe],
  );

  // The disc just bounds the seeds.
  const lastR = seeds.length ? seeds[seeds.length - 1].r : 1;
  const discR = lastR + spacing;

  return (
    <>
      <PerspectiveCamera makeDefault position={[0.7, 1.4, 0.7]} fov={36} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[2, 4, 3]} intensity={0.8} />
      {/* The disc lies in the xz-plane: cylinderGeometry's axis is Y by
          default, which is exactly what we want. */}
      <mesh material={discMat}>
        <cylinderGeometry args={[discR, discR * 0.95, 0.02, 64]} />
      </mesh>
      {seeds.map(({ x, z }, i) => (
        <mesh
          key={i}
          position={[x, 0.018, z]}
          material={seedMat}
        >
          <sphereGeometry args={[Math.max(0.005, spacing * 0.4), 6, 6]} />
        </mesh>
      ))}
      <OrbitControls
        target={[0, 0, 0]}
        enablePan={false}
        minDistance={0.6}
        maxDistance={5}
      />
    </>
  );
}

/** Phyllotaxis stages: dots only or dots + spiral connectors. */
function PhyllotaxisStage({
  count,
  spacing,
  mode,
}: {
  count: number;
  spacing: number;
  mode: "dots" | "spiral";
}) {
  const seeds = useMemo(() => phyllotaxisDisc(count, spacing), [count, spacing]);
  const linePts = useMemo(() => {
    if (mode !== "spiral") return [];
    return seeds.map((s) => new Vector3(s.x, 0, s.z));
  }, [seeds, mode]);

  return (
    <>
      <PerspectiveCamera makeDefault position={[0.7, 1.4, 0.7]} fov={36} />
      <ambientLight intensity={0.9} />
      {mode === "spiral" ? <SpineLine points={linePts} /> : null}
      {seeds.map(({ x, z }, i) => (
        <mesh key={i} position={[x, 0, z]}>
          <sphereGeometry args={[Math.max(0.004, spacing * 0.3), 6, 6]} />
          <meshBasicMaterial color="#9d174d" />
        </mesh>
      ))}
      <OrbitControls enablePan={false} minDistance={0.5} maxDistance={5} />
    </>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   §4 — The flower head (layers + center)
   ─────────────────────────────────────────────────────────────────────── */

function FlowerHeadSection() {
  const [type, setType] = useState<FlowerType>("rose");

  return (
    <section className="space-y-10 mt-24">
      <SectionHeader index="§4" title="The flower head" />

      <Prose>
        <p>
          Putting §1, §2 and §3 together: a flower head is a small recipe of
          petal layers stacked on top of each other, optionally with a
          phyllotaxis disc for the centre. Different species are different
          recipes — same code, different parameters.
        </p>
      </Prose>

      <SubHeading>4.1 — Recipe</SubHeading>

      <Prose>
        <p>The data type is a list of layers and an optional centre:</p>
        <Display>{`\\textit{head} \\;=\\; \\bigl\\{\\, \\textit{layers}: [\\ell_0, \\ldots, \\ell_{m-1}],\\; \\textit{center}?: (c_{\\text{col}}, r_c, n_c, h_c) \\bigr\\}`}</Display>
        <p>Each layer carries</p>
        <Display>{`\\ell_i = \\bigl(n_i,\\; r_i,\\; \\alpha_i,\\; \\tau_i,\\; \\varphi_i,\\; y_{0,i},\\; \\Delta c_i,\\; \\textit{shape}_i\\bigr)`}</Display>
        <p>
          where <Tex>{`\\textit{shape}_i \\in \\mathcal{P}`}</Tex> is the
          petal shape from §1, and <Tex>{`\\Delta c_i`}</Tex> is a colour
          shift applied to the base hue (so inner layers can read darker
          without per-petal painting).
        </p>
        <p>
          The full vertex transform for a vertex of petal{" "}
          <Tex>{`k`}</Tex> in layer <Tex>{`i`}</Tex> is the chain we built
          up in §1 and §2:
        </p>
        <Display>{`\\mathbf{v}_{\\text{flower}} = \\underbrace{\\mathbf{x}_{i,k} + R_{i,k}\\, \\mathbf{v}_{\\text{petal-local}}}_{\\text{from §2}}`}</Display>
        <p>
          and the rendered colour is{" "}
          <Tex>{`\\mathrm{shade}(c_{\\text{base}},\\, \\Delta c_i)`}</Tex>{" "}
          (a small HSL nudge), modulated by the riso shader (§ outside the
          scope of this note).
        </p>
      </Prose>

      <SubHeading>4.2 — Three example recipes</SubHeading>

      <Prose>
        <p>
          Different species are different parameter trajectories — the
          algorithm is unchanged. Three illustrative cases:
        </p>
        <Display>{`\\begin{aligned} \\textit{rose} &: m = 5, \\quad r_i = 0.05 + 0.07i, \\quad \\alpha_i = -1.1 + 0.18i, \\quad n_i = 8 + 2i \\\\ \\textit{daisy} &: m = 1, \\quad r = 0.18, \\quad \\alpha = -0.4, \\quad n = 13, \\quad \\textit{centre present} \\\\ \\textit{sunflower} &: m = 1, \\quad r = 0.45, \\quad \\alpha = 0.0, \\quad n = 28, \\quad \\textit{centre, large} \\end{aligned}`}</Display>
        <p>
          A rose is concentric layers and no centre disc. A daisy is a
          single ring of mid-tilt petals around a small phyllotaxis disc.
          A sunflower is one nearly-flat ring of long petals around a big
          phyllotaxis disc.
        </p>
      </Prose>

      <SubHeading>4.3 — Construction stages</SubHeading>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Figure caption="(a) Wireframe of the head — all triangles visible.">
          <LazyCanvas height={300}>
            <FlowerHeadScene type={type} wireframe />
          </LazyCanvas>
        </Figure>
        <Figure caption="(b) The same head shaded with the riso material.">
          <LazyCanvas height={300}>
            <FlowerHeadScene type={type} />
          </LazyCanvas>
        </Figure>
      </div>

      <div className="rounded-2xl bg-white border border-neutral-200 p-5 space-y-3">
        <p className="text-xs font-mono uppercase tracking-widest text-neutral-500">
          species
        </p>
        <div className="flex flex-wrap gap-2">
          {(
            [
              "rose",
              "tulip",
              "sunflower",
              "daisy",
              "peony",
              "lily",
              "iris",
              "chrysanthemum",
            ] as FlowerType[]
          ).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={
                t === type
                  ? "px-3 py-1 rounded-md text-xs bg-neutral-950 text-white"
                  : "px-3 py-1 rounded-md text-xs bg-white border border-neutral-200 hover:bg-neutral-50"
              }
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function FlowerHeadScene({
  type,
  wireframe = false,
}: {
  type: FlowerType;
  wireframe?: boolean;
}) {
  const FlowerHeadCmp = useFlowerHeadComponent();
  const flower = useMemo(() => defaultFlower(type), [type]);
  return (
    <>
      <PerspectiveCamera makeDefault position={[1.6, 1.4, 1.6]} fov={36} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 5, 4]} intensity={1.0} />
      <WireframeWrap enabled={wireframe}>
        <group position={[0, -0.1, 0]} scale={1.6}>
          <FlowerHeadCmp flower={flower} />
        </group>
      </WireframeWrap>
      <OrbitControls
        enablePan={false}
        minDistance={0.8}
        maxDistance={6}
      />
    </>
  );
}

/** Walk descendants on mount and toggle every material's `wireframe` flag.
 * This lets us reuse complex production components in a wireframe view. */
function WireframeWrap({
  enabled,
  children,
}: {
  enabled: boolean;
  children: ReactNode;
}) {
  const ref = useRef<import("three").Group>(null);
  useEffect(() => {
    if (!ref.current) return;
    ref.current.traverse((obj) => {
      const o = obj as { material?: unknown };
      if (!o.material) return;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of mats) {
        const mat = m as { wireframe?: boolean };
        if ("wireframe" in mat) mat.wireframe = enabled;
      }
    });
  }, [enabled, children]);
  return <group ref={ref}>{children}</group>;
}

/* ──────────────────────────────────────────────────────────────────────────
   §5 — The stem (Catmull-Rom spline)
   ─────────────────────────────────────────────────────────────────────── */

function StemSection() {
  const [headOffset, setHeadOffset] = useState({ x: 1.2, y: 2.2, z: 0.2 });
  const [seed, setSeed] = useState(0);

  return (
    <section className="space-y-10 mt-24">
      <SectionHeader index="§5" title="The stem" />

      <Prose>
        <p>
          A stem is a tube swept along a smooth space curve from a base
          point on the holder to the head of the flower. The curve has to
          pass exactly through both endpoints, lift gently out of the
          holder, and approach the head along the{" "}
          <Tex>{`\\textit{base} \\to \\textit{head}`}</Tex> direction.
        </p>
      </Prose>

      <SubHeading>5.1 — Catmull-Rom splines</SubHeading>

      <Prose>
        <p>
          A Catmull-Rom spline is a piecewise cubic that interpolates a
          sequence of control points <Tex>{`P_0, \\ldots, P_n`}</Tex>{" "}
          continuously through to second derivatives. On the segment
          between <Tex>{`P_i`}</Tex> and <Tex>{`P_{i+1}`}</Tex> with parameter{" "}
          <Tex>{`u \\in [0,1]`}</Tex>, the curve is
        </p>
        <Display>{`C(u) = \\tfrac{1}{2}\\bigl[1,\\, u,\\, u^2,\\, u^3\\bigr] \\begin{bmatrix} 0 & 2 & 0 & 0 \\\\ -t & 0 & t & 0 \\\\ 2t & t-3 & 3-2t & -t \\\\ -t & 2-t & t-2 & t \\end{bmatrix} \\begin{bmatrix} P_{i-1} \\\\ P_i \\\\ P_{i+1} \\\\ P_{i+2} \\end{bmatrix}`}</Display>
        <p>
          where <Tex>{`t`}</Tex> is the <strong>tension</strong> parameter.
          We use <Tex>{`t = 0.3`}</Tex>: low enough that the curve sweeps
          smoothly through the controls, high enough that it does not
          overshoot. The standard <em>uniform</em> Catmull-Rom corresponds
          to <Tex>{`t = 0.5`}</Tex>; lower means looser.
        </p>
        <p>
          Two properties of Catmull-Rom matter here: the curve <em>visits
          every control point exactly</em> (so the head is exactly at the
          flower's head, not approximately), and the tangent at{" "}
          <Tex>{`P_i`}</Tex> is parallel to <Tex>{`P_{i+1} - P_{i-1}`}</Tex>{" "}
          (which is why placing <Tex>{`P_3`}</Tex> just behind the head in
          the head-from-base direction makes the stem approach the flower
          head straight, not from the side).
        </p>
      </Prose>

      <SubHeading>5.2 — Choosing the control points</SubHeading>

      <Prose>
        <p>Five control points are placed deterministically:</p>
        <Display>{`\\begin{aligned} P_0 &= \\textit{base} \\\\ P_1 &= \\textit{base} + 0.18\\,\\mathbf{d} + 0.18\\, L\\, \\hat{\\mathbf{y}} \\\\ P_2 &= \\textit{base} + 0.50\\,\\mathbf{d} + 0.12\\, L\\, \\hat{\\mathbf{y}} + \\boldsymbol{\\eta} \\\\ P_3 &= \\textit{head} - 0.12\\,\\mathbf{d} \\\\ P_4 &= \\textit{head} \\end{aligned}`}</Display>
        <p>
          where <Tex>{`\\mathbf{d} = \\textit{head} - \\textit{base}`}</Tex>,{" "}
          <Tex>{`L = \\lVert \\mathbf{d} \\rVert`}</Tex>, and{" "}
          <Tex>{`\\boldsymbol{\\eta}`}</Tex> is a small lateral perturbation
          drawn from a per-stem PRNG so two adjacent stems do not curve
          identically.
        </p>
        <ul>
          <li>
            <strong>Lift</strong> <Tex>{`P_1`}</Tex>: 18% of the way to the
            head plus 18% of <Tex>{`L`}</Tex> straight up. This avoids the
            kink we would get if it pointed purely upward.
          </li>
          <li>
            <strong>Mid</strong> <Tex>{`P_2`}</Tex>: 50% along the chord
            with a small extra lift so the curve sweeps as an arc (rather
            than dipping below the chord). The lateral jitter sits on the
            in-plane perpendicular only, so it doesn't disturb the up
            direction.
          </li>
          <li>
            <strong>Approach</strong> <Tex>{`P_3`}</Tex>: 12% before the
            head along <Tex>{`\\mathbf{d}`}</Tex>. By the tangent property
            this makes the curve arrive at the head pointing in{" "}
            <Tex>{`\\mathbf{d}`}</Tex>, eliminating any whip.
          </li>
        </ul>
      </Prose>

      <SubHeading>5.3 — From curve to tube</SubHeading>

      <Prose>
        <p>
          Once the curve is built, we sweep a constant-radius circle along
          it: at each of <Tex>{`N_\\text{long} = 36`}</Tex> samples we pick
          the curve point and tangent, build a circle in the perpendicular
          plane with <Tex>{`N_\\text{rad} = 10`}</Tex> vertices, and
          triangulate adjacent rings. The resulting tube has{" "}
          <Tex>{`N_\\text{long} N_\\text{rad} = 360`}</Tex> vertices and
          twice that many triangles per stem.
        </p>
        <p>
          Three.js's <Tex>{`\\textit{TubeGeometry}`}</Tex> handles the
          frame propagation (each ring's orientation is computed from the
          previous to avoid twists). The radius is{" "}
          <Tex>{`r = 0.018`}</Tex> world units, much smaller than a flower
          head, so a stem reads as a thin line at typical zoom.
        </p>
      </Prose>

      <SubHeading>5.4 — Construction stages</SubHeading>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Figure caption="(a) The five control points in space.">
          <LazyCanvas height={300}>
            <StemControlsStage
              head={new Vector3(headOffset.x, headOffset.y, headOffset.z)}
              seed={seed}
            />
          </LazyCanvas>
        </Figure>
        <Figure caption="(b) Catmull-Rom curve through the controls.">
          <LazyCanvas height={300}>
            <StemCurveStage
              head={new Vector3(headOffset.x, headOffset.y, headOffset.z)}
              seed={seed}
            />
          </LazyCanvas>
        </Figure>
        <Figure caption="(c) Tube around the curve, wireframe.">
          <LazyCanvas height={300}>
            <StemScene
              head={new Vector3(headOffset.x, headOffset.y, headOffset.z)}
              seed={seed}
              wireframe
            />
          </LazyCanvas>
        </Figure>
        <Figure caption="(d) Final stem, shaded.">
          <LazyCanvas height={300}>
            <StemScene
              head={new Vector3(headOffset.x, headOffset.y, headOffset.z)}
              seed={seed}
            />
          </LazyCanvas>
        </Figure>
      </div>

      <div className="rounded-2xl bg-white border border-neutral-200 p-5 space-y-3">
        <p className="text-xs font-mono uppercase tracking-widest text-neutral-500">
          parameters
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
          <Slider label="head x" v={headOffset.x} min={-2} max={2} step={0.05} onChange={(v) => setHeadOffset((h) => ({ ...h, x: v }))} />
          <Slider label="head y" v={headOffset.y} min={0.5} max={3.5} step={0.05} onChange={(v) => setHeadOffset((h) => ({ ...h, y: v }))} />
          <Slider label="head z" v={headOffset.z} min={-2} max={2} step={0.05} onChange={(v) => setHeadOffset((h) => ({ ...h, z: v }))} />
          <Slider label="seed" v={seed} min={0} max={50} step={1} onChange={setSeed} />
        </div>
      </div>
    </section>
  );
}

function StemScene({
  head,
  seed,
  wireframe = false,
}: {
  head: Vector3;
  seed: number;
  wireframe?: boolean;
}) {
  const base = useMemo(() => new Vector3(0, 0, 0), []);
  const curve = useMemo(
    () => makeBendableStemCurve(base, head, seed),
    [base, head, seed],
  );
  const tube = useMemo(() => new TubeGeometry(curve, 36, 0.018, 10, false), [curve]);
  const mat = useMemo(
    () =>
      wireframe
        ? new MeshBasicMaterial({ color: "#7fa66a", wireframe: true })
        : createRisoStemMaterial("#a8c98a"),
    [wireframe],
  );

  return (
    <>
      <PerspectiveCamera makeDefault position={[3, 2, 3]} fov={36} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 5, 4]} intensity={1.0} />
      <mesh geometry={tube} material={mat} />
      <OrbitControls target={[0, 1, 0]} enablePan={false} minDistance={1} maxDistance={10} />
    </>
  );
}

/** §5 stage (a): just the five control points, with annotations. */
function StemControlsStage({ head, seed }: { head: Vector3; seed: number }) {
  const base = new Vector3(0, 0, 0);
  const dir = new Vector3().subVectors(head, base);
  const L = dir.length();
  const rand = mulberry32(seed);
  void rand;
  const lift = base.clone().addScaledVector(dir, 0.18).addScaledVector(new Vector3(0, 1, 0), 0.18 * L);
  const mid = base.clone().addScaledVector(dir, 0.5).addScaledVector(new Vector3(0, 1, 0), 0.12 * L);
  const approach = head.clone().addScaledVector(dir, -0.12);
  const points = [base, lift, mid, approach, head];
  const colors = ["#dc2626", "#1d4ed8", "#1d4ed8", "#1d4ed8", "#059669"];
  return (
    <>
      <PerspectiveCamera makeDefault position={[3, 2, 3]} fov={36} />
      <ambientLight intensity={0.9} />
      {/* Chord and ground plane reference. */}
      <SpineLine points={[base, head]} />
      {points.map((p, i) => (
        <mesh key={i} position={[p.x, p.y, p.z]}>
          <sphereGeometry args={[0.045, 12, 12]} />
          <meshBasicMaterial color={colors[i]} />
        </mesh>
      ))}
      <OrbitControls target={[0, 1, 0]} enablePan={false} minDistance={1} maxDistance={10} />
    </>
  );
}

/** §5 stage (b): curve + control points. */
function StemCurveStage({ head, seed }: { head: Vector3; seed: number }) {
  const base = new Vector3(0, 0, 0);
  const curve = useMemo(
    () => makeBendableStemCurve(base, head, seed),
    [base, head, seed],
  );
  // Sample the curve into a polyline.
  const samples = useMemo(() => {
    const N = 64;
    const pts: Vector3[] = [];
    for (let i = 0; i <= N; i++) pts.push(curve.getPoint(i / N));
    return pts;
  }, [curve]);
  const dir = new Vector3().subVectors(head, base);
  const L = dir.length();
  const lift = base.clone().addScaledVector(dir, 0.18).addScaledVector(new Vector3(0, 1, 0), 0.18 * L);
  const mid = base.clone().addScaledVector(dir, 0.5).addScaledVector(new Vector3(0, 1, 0), 0.12 * L);
  const approach = head.clone().addScaledVector(dir, -0.12);
  const points = [base, lift, mid, approach, head];
  return (
    <>
      <PerspectiveCamera makeDefault position={[3, 2, 3]} fov={36} />
      <ambientLight intensity={0.9} />
      <SpineLine points={samples} />
      {points.map((p, i) => (
        <mesh key={i} position={[p.x, p.y, p.z]}>
          <sphereGeometry args={[0.035, 10, 10]} />
          <meshBasicMaterial color="#1d4ed8" />
        </mesh>
      ))}
      <OrbitControls target={[0, 1, 0]} enablePan={false} minDistance={1} maxDistance={10} />
    </>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   §6 — Stem leaves
   ─────────────────────────────────────────────────────────────────────── */

function LeavesSection() {
  const [seed, setSeed] = useState(0);
  return (
    <section className="space-y-10 mt-24">
      <SectionHeader index="§6" title="Leaves" />

      <Prose>
        <p>
          Leaves are sparse — one or two per stem — placed somewhere along
          its mid-section. The leaf surface is just another instance of
          the parametric petal from §1, re-parameterised with a shorter
          length and a wider taper.
        </p>
      </Prose>

      <SubHeading>6.1 — Where to put a leaf</SubHeading>

      <Prose>
        <p>
          For each leaf we sample a parameter on the stem curve,
        </p>
        <Display>{`t \\sim \\mathcal{U}(0.25,\\, 0.85)`}</Display>
        <p>
          and read off the curve point <Tex>{`\\mathbf{c}(t)`}</Tex> and
          unit tangent <Tex>{`\\mathbf{T}(t) = \\mathbf{c}'(t) / \\lVert \\mathbf{c}'(t) \\rVert`}</Tex>.
          The leaf's base is anchored at <Tex>{`\\mathbf{c}(t)`}</Tex>; its
          long axis must follow <Tex>{`\\mathbf{T}(t)`}</Tex> so the leaf
          appears to grow out of the stem.
        </p>
      </Prose>

      <SubHeading>6.2 — Aligning the leaf to the stem</SubHeading>

      <Prose>
        <p>
          The petal mesh is constructed in petal-local space with its
          spine along <Tex>{`+\\hat{\\mathbf{y}}`}</Tex> (after a 90° tilt
          from §1's <Tex>{`+\\hat{\\mathbf{z}}`}</Tex> convention; we
          adopt the y-up convention for leaves). To attach it to the stem
          we need a quaternion that rotates <Tex>{`\\hat{\\mathbf{y}}`}</Tex>{" "}
          to <Tex>{`\\mathbf{T}(t)`}</Tex>. Three.js's{" "}
          <Tex>{`\\textit{setFromUnitVectors}`}</Tex> computes this with
          the standard formula
        </p>
        <Display>{`q_{\\text{align}} \\;=\\; \\bigl(\\,\\hat{\\mathbf{y}} \\times \\mathbf{T},\\; 1 + \\hat{\\mathbf{y}} \\!\\cdot\\! \\mathbf{T}\\,\\bigr) \\;\\big/\\; \\lVert \\cdot \\rVert`}</Display>
        <p>
          which is the half-angle quaternion between the two unit vectors.
          We then post-multiply by a free yaw around the leaf's local up
          and a small tilt around its local <Tex>{`\\hat{\\mathbf{x}}`}</Tex>:
        </p>
        <Display>{`q \\;=\\; q_{\\text{align}} \\,\\cdot\\, q_{\\text{yaw}}(2\\pi \\xi) \\,\\cdot\\, q_{\\text{tilt}}(-0.6)`}</Display>
        <p>
          The yaw randomises the rotation around the stem so leaves do
          not all face the same direction; the tilt droops the leaf
          slightly outward, away from vertical, so it reads as gravity
          had pulled it down.
        </p>
      </Prose>

      <SubHeading>6.3 — Construction stages</SubHeading>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Figure caption="(a) Wireframe — same petalGeometry, different parameters.">
          <LazyCanvas height={300}>
            <LeavesScene seed={seed} wireframe />
          </LazyCanvas>
        </Figure>
        <Figure caption="(b) Shaded.">
          <LazyCanvas height={300}>
            <LeavesScene seed={seed} />
          </LazyCanvas>
        </Figure>
      </div>

      <div className="rounded-2xl bg-white border border-neutral-200 p-5">
        <Slider label="seed" v={seed} min={0} max={40} step={1} onChange={setSeed} />
      </div>
    </section>
  );
}

function LeavesScene({
  seed,
  wireframe = false,
}: {
  seed: number;
  wireframe?: boolean;
}) {
  const head = useMemo(() => new Vector3(0.6, 2.1, 0.3), []);
  const curve = useMemo(
    () => makeBendableStemCurve(new Vector3(), head, seed),
    [head, seed],
  );
  const tube = useMemo(() => new TubeGeometry(curve, 36, 0.018, 10, false), [curve]);
  const stemMat = useMemo(
    () =>
      wireframe
        ? new MeshBasicMaterial({ color: "#7fa66a", wireframe: true })
        : createRisoStemMaterial("#a8c98a"),
    [wireframe],
  );
  const leaves = useMemo(() => buildStemLeaves(curve, seed), [curve, seed]);
  const palette = useMemo(() => getFlowerPalette("rose"), []);
  const leafMat = useMemo(
    () =>
      wireframe
        ? new MeshBasicMaterial({ color: "#7fa66a", wireframe: true })
        : createRisoPetalMaterial({
            baseColor: "#7fa66a",
            palette,
            doubleSide: true,
          }),
    [palette, wireframe],
  );

  return (
    <>
      <PerspectiveCamera makeDefault position={[2.4, 1.6, 2.4]} fov={36} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 5, 4]} intensity={1.0} />
      <mesh geometry={tube} material={stemMat} />
      {leaves.map((leaf) => (
        <mesh
          key={leaf.key}
          geometry={leaf.geometry}
          material={leafMat}
          position={leaf.position}
          quaternion={leaf.quaternion as unknown as Quaternion}
        />
      ))}
      <OrbitControls target={[0, 1, 0]} enablePan={false} minDistance={1} maxDistance={10} />
    </>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   §7 — Bouquet packing
   ─────────────────────────────────────────────────────────────────────── */

function BouquetSection() {
  const [counts, setCounts] = useState<Record<FlowerType, number>>({
    rose: 5,
    tulip: 0,
    sunflower: 0,
    daisy: 6,
    lavender: 0,
    peony: 2,
    "babys-breath": 8,
    hydrangea: 0,
    carnation: 0,
    lily: 0,
    iris: 0,
    chrysanthemum: 0,
  });
  const [showBounds, setShowBounds] = useState(false);
  const [seed, setSeed] = useState(0);

  const flowers = useMemo<Flower[]>(
    () =>
      (Object.entries(counts) as [FlowerType, number][]).flatMap(
        ([type, count]) =>
          Array.from({ length: count }, () => defaultFlower(type)),
      ),
    [counts],
  );

  return (
    <section className="space-y-10 mt-24">
      <SectionHeader index="§7" title="Bouquet packing" />

      <Prose>
        <p>
          Given a multiset of flowers <Tex>{`F = \\{f_1, \\ldots, f_N\\}`}</Tex>,
          we need to place each one so heads do not intersect, the silhouette
          reads as a dome, and bigger heads cluster nearer the centre. The
          procedure has four steps. Each one is described below, then
          shown as a wireframe stage.
        </p>
      </Prose>

      <SubHeading>7.1 — Bounding each head with an ellipsoid</SubHeading>

      <Prose>
        <p>
          Every flower type has a tabulated axis-aligned ellipsoid{" "}
          <Tex>{`E_i = (r_{x,i},\\, r_{y,i},\\, r_{z,i})`}</Tex> capturing
          the rendered head's projected extent. Bigger flowers (sunflower:{" "}
          <Tex>{`(0.85,\\, 0.20,\\, 0.85)`}</Tex>) get larger ellipsoids;
          smaller ones (baby's breath: <Tex>{`(0.28,\\, 0.18,\\, 0.28)`}</Tex>){" "}
          smaller ones. We pack against ellipsoids, not actual meshes —
          collision testing two ellipsoids is constant-time, while testing
          two thousand-triangle heads is not.
        </p>
      </Prose>

      <SubHeading>7.2 — Estimating the dome</SubHeading>

      <Prose>
        <p>
          The bouquet should fit on a roughly circular footprint. Sum the
          projected disc areas of all heads (with padding{" "}
          <Tex>{`p`}</Tex> applied to each radius) and fit a circle of
          equal area:
        </p>
        <Display>{`\\begin{aligned} A &= \\sum_i \\pi\\,(r_{x,i} + p)(r_{z,i} + p) \\\\ \\textit{domeR} &= \\max\\!\\Bigl(0.4,\\; 1.1\\,\\sqrt{A / \\pi}\\Bigr) \\\\ \\textit{domeH} &= 0.55 \\cdot \\textit{domeR} \\end{aligned}`}</Display>
        <p>
          The factor <Tex>{`1.1`}</Tex> is slack: 10% extra room so
          packing has degrees of freedom. The height is fixed at 55% of
          the radius — a flatter dome reads as a posy, a taller one
          reads as a sphere. This particular ratio gives the bouquet
          shape we want.
        </p>
        <p>
          The dome is parameterised by a single ratio{" "}
          <Tex>{`t \\in [0, 1]`}</Tex> running from centre (0) to rim
          (1). At ratio <Tex>{`t`}</Tex> the dome point at angle{" "}
          <Tex>{`\\theta`}</Tex> is
        </p>
        <Display>{`\\mathbf{D}(t, \\theta) = \\Bigl(\\, \\textit{domeR} \\sqrt{t} \\cos\\theta,\\; \\textit{baseY} + \\textit{domeH}(1-t),\\; \\textit{domeR} \\sqrt{t} \\sin\\theta \\,\\Bigr)`}</Display>
        <p>
          The square root in the radial coordinate, exactly as in the
          phyllotaxis disc, gives uniform area density — important so
          flowers cluster correctly without bias toward the centre.
        </p>
        <p>The outward surface normal at <Tex>{`\\mathbf{D}(t, \\theta)`}</Tex> is the gradient of the implicit dome shape:</p>
        <Display>{`\\hat{\\mathbf{n}}(t, \\theta) \\;\\propto\\; \\Bigl(\\, \\frac{\\textit{domeR}\\sqrt{t}\\cos\\theta}{\\textit{domeR}^2},\\; \\frac{2(1-t)}{\\textit{domeH}},\\; \\frac{\\textit{domeR}\\sqrt{t}\\sin\\theta}{\\textit{domeR}^2} \\Bigr)`}</Display>
        <p>
          normalised. This is the orientation the flower's tilt is
          aligned to, so an outward-edge flower leans outward while a
          centre flower stays vertical.
        </p>
      </Prose>

      <SubHeading>7.3 — Candidate sequence</SubHeading>

      <Prose>
        <p>
          We slice the dome into <Tex>{`C = 60`}</Tex> radial shells. For
          each shell <Tex>{`c \\in \\{0, \\ldots, C-1\\}`}</Tex> the
          ratio is <Tex>{`t_c = (c + 0.5)/C`}</Tex>. The angular
          coordinate is generated by a deterministic spiral so we never
          retry the same direction:
        </p>
        <Display>{`\\theta_s = s \\cdot \\psi + \\varepsilon, \\quad \\psi = \\pi(3 - \\sqrt{5}), \\quad \\varepsilon \\sim \\mathcal{U}(-0.025, 0.025)`}</Display>
        <p>
          For the <Tex>{`i`}</Tex>-th flower we walk{" "}
          <Tex>{`s = i \\cdot C, i \\cdot C + 1, \\ldots`}</Tex> through
          all <Tex>{`C`}</Tex> shells and call the result the candidate
          sequence for that flower.
        </p>
      </Prose>

      <SubHeading>7.4 — Greedy placement with collision tests</SubHeading>

      <Prose>
        <p>
          Sort the flowers by their head size{" "}
          <Tex>{`\\max(r_{x,i},\\, r_{z,i})`}</Tex>, biggest first. For
          each flower we walk its candidate sequence and accept the first
          position whose ellipsoid does not collide with any
          already-placed ellipsoid. Two axis-aligned ellipsoids overlap
          when
        </p>
        <Display>{`\\frac{(\\Delta x)^2}{(r_{x,a} + r_{x,b} + p)^2} + \\frac{(\\Delta y)^2}{(r_{y,a} + r_{y,b} + p)^2} + \\frac{(\\Delta z)^2}{(r_{z,a} + r_{z,b} + p)^2} \\;<\\; 1`}</Display>
        <p>
          The denominators are the Minkowski sums of the two ellipsoids'
          radii (plus padding). This is the standard axis-aligned
          conservative test: it can occasionally report a collision when
          there is none, but never the reverse, and the false-positive
          cost is just one rejected candidate. If after six retry
          passes the flower still cannot be placed, we drop it (rare at
          normal counts).
        </p>
        <p>
          The total work is <Tex>{`O(N^2 C)`}</Tex> in the worst case (we
          re-test every placed flower for every candidate). For{" "}
          <Tex>{`N = 30`}</Tex> and <Tex>{`C = 60`}</Tex> that's 54000
          scalar ops per call — negligible. The greedy by-size heuristic
          gets us close to optimal packing in practice without an
          optimisation step.
        </p>
        <p>The output is a list of placements</p>
        <Display>{`\\textit{Placement}_i = \\bigl( f_i,\\; \\textit{base}_i,\\; \\textit{head}_i,\\; \\hat{\\mathbf{n}}_i,\\; E_i \\bigr)`}</Display>
        <p>
          with <Tex>{`\\textit{head}_i = \\mathbf{D}(t, \\theta)`}</Tex>{" "}
          on the dome and <Tex>{`\\textit{base}_i`}</Tex> in a small
          random disc near the holder. The renderer then takes each
          placement, draws a stem from <Tex>{`\\textit{base}_i`}</Tex>{" "}
          to <Tex>{`\\textit{head}_i`}</Tex> (§5), attaches a flower head
          there (§4) oriented to <Tex>{`\\hat{\\mathbf{n}}_i`}</Tex>, and
          we are done.
        </p>
      </Prose>

      <SubHeading>7.5 — Construction stages</SubHeading>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Figure caption="(a) The bare dome surface as a wireframe.">
          <LazyCanvas height={300}>
            <BouquetDomeStage flowers={flowers} seed={seed} />
          </LazyCanvas>
        </Figure>
        <Figure caption="(b) The first 50 candidate positions in spiral order, before any collision tests.">
          <LazyCanvas height={300}>
            <BouquetCandidatesStage flowers={flowers} seed={seed} />
          </LazyCanvas>
        </Figure>
        <Figure caption="(c) Final placements with their collision ellipsoids visible.">
          <LazyCanvas height={300}>
            <BouquetScene flowers={flowers} seed={seed} showBounds={true} />
          </LazyCanvas>
        </Figure>
        <Figure caption="(d) Bouquet, shaded.">
          <LazyCanvas height={300}>
            <BouquetScene flowers={flowers} seed={seed} showBounds={false} />
          </LazyCanvas>
        </Figure>
      </div>

      <div className="rounded-2xl bg-white border border-neutral-200 p-5 space-y-3">
        <p className="text-xs font-mono uppercase tracking-widest text-neutral-500">
          parameters
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
          {(Object.keys(counts) as FlowerType[]).map((t) => (
            <Slider
              key={t}
              label={t}
              v={counts[t]}
              min={0}
              max={12}
              step={1}
              onChange={(v) =>
                setCounts((c) => ({ ...c, [t]: v }))
              }
            />
          ))}
          <Slider label="seed" v={seed} min={0} max={50} step={1} onChange={setSeed} />
        </div>
        <label className="flex items-center gap-2 text-xs text-neutral-700 cursor-pointer">
          <input
            type="checkbox"
            checked={showBounds}
            onChange={(e) => setShowBounds(e.target.checked)}
            className="size-4 accent-neutral-950"
          />
          show ellipsoids
        </label>
      </div>
    </section>
  );
}

function BouquetScene({
  flowers,
  seed,
  showBounds,
}: {
  flowers: Flower[];
  seed: number;
  showBounds: boolean;
}) {
  const FlowerHeadCmp = useFlowerHeadComponent();
  const baseY = 1.6;
  const { placements, domeR } = useMemo(() => {
    const seedNum = hashSeed(`bouquet:${flowers.length}:${seed}`);
    return packBouquet(flowers, Math.floor(seedNum * 1e9) + seed, { baseY });
  }, [flowers, seed]);

  const targetDomeR = 4.6;
  const scale = Math.min(4, Math.max(0.6, targetDomeR / Math.max(domeR, 0.2)));

  const boundsMat = useMemo(
    () =>
      new MeshBasicMaterial({
        color: "#3d7eff",
        transparent: true,
        opacity: 0.18,
        wireframe: true,
        depthWrite: false,
      }),
    [],
  );

  const stemMat = useMemo(() => createRisoStemMaterial("#a8c98a"), []);

  return (
    <>
      <PerspectiveCamera makeDefault position={[8, 6, 8]} fov={36} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 8, 5]} intensity={1.1} />
      <group position={[0, baseY * (1 - scale), 0]} scale={scale}>
        {placements.map((p, i) => (
          <group key={i}>
            {/* stem */}
            <Tube curve={makeBendableStemCurve(p.base, p.head, i + seed)} mat={stemMat} />
            {/* head */}
            <group
              position={[p.head.x, p.head.y, p.head.z]}
              scale={sizeScale(p.flower.size)}
            >
              <FlowerHeadCmp flower={p.flower} />
            </group>
            {showBounds ? (
              <mesh
                position={[p.head.x, p.head.y, p.head.z]}
                scale={[p.bounds.rx, p.bounds.ry, p.bounds.rz]}
                material={boundsMat}
              >
                <sphereGeometry args={[1, 16, 12]} />
              </mesh>
            ) : null}
          </group>
        ))}
      </group>
      <OrbitControls target={[0, 2, 0]} enablePan={false} minDistance={2} maxDistance={20} />
    </>
  );
}

/** §7 stage (a): the dome surface only. */
function BouquetDomeStage({
  flowers,
  seed,
}: {
  flowers: Flower[];
  seed: number;
}) {
  const baseY = 1.6;
  const { domeR, domeH } = useMemo(() => {
    const seedNum = hashSeed(`bouquet:${flowers.length}:${seed}`);
    return packBouquet(flowers, Math.floor(seedNum * 1e9) + seed, { baseY });
  }, [flowers, seed]);

  // Build a dome wireframe by sampling D(t, θ).
  const domeGeom = useMemo(() => {
    const tSegs = 12;
    const aSegs = 32;
    const positions: number[] = [];
    const indices: number[] = [];
    for (let i = 0; i <= tSegs; i++) {
      const t = i / tSegs;
      for (let j = 0; j <= aSegs; j++) {
        const a = (j / aSegs) * Math.PI * 2;
        const flat = Math.sqrt(t);
        const x = domeR * flat * Math.cos(a);
        const y = baseY + domeH * (1 - t);
        const z = domeR * flat * Math.sin(a);
        positions.push(x, y, z);
      }
    }
    for (let i = 0; i < tSegs; i++) {
      for (let j = 0; j < aSegs; j++) {
        const idx0 = i * (aSegs + 1) + j;
        const idx1 = idx0 + 1;
        const idx2 = idx0 + (aSegs + 1);
        const idx3 = idx2 + 1;
        indices.push(idx0, idx2, idx1, idx1, idx2, idx3);
      }
    }
    return {
      positions: new Float32Array(positions),
      indices: new Uint16Array(indices),
    };
  }, [domeR, domeH, baseY]);

  return (
    <>
      <PerspectiveCamera makeDefault position={[8, 6, 8]} fov={36} />
      <ambientLight intensity={0.9} />
      <mesh>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[domeGeom.positions, 3]}
          />
          <bufferAttribute attach="index" args={[domeGeom.indices, 1]} />
        </bufferGeometry>
        <meshBasicMaterial color="#1d4ed8" wireframe />
      </mesh>
      <OrbitControls target={[0, baseY + domeH * 0.3, 0]} enablePan={false} minDistance={2} maxDistance={20} />
    </>
  );
}

/** §7 stage (b): candidate positions, in spiral order. */
function BouquetCandidatesStage({
  flowers,
  seed,
}: {
  flowers: Flower[];
  seed: number;
}) {
  const baseY = 1.6;
  const { domeR, domeH } = useMemo(() => {
    const seedNum = hashSeed(`bouquet:${flowers.length}:${seed}`);
    return packBouquet(flowers, Math.floor(seedNum * 1e9) + seed, { baseY });
  }, [flowers, seed]);

  // Build candidates in the same spiral order as the packer but ignoring
  // collision — purely for illustration of where the algorithm 'looks'.
  const candidates = useMemo(() => {
    const C = 60;
    const out: Vector3[] = [];
    const totalShown = Math.min(C, 50);
    for (let c = 0; c < totalShown; c++) {
      const t = (c + 0.5) / C;
      const s = c;
      const theta = s * GOLDEN_ANGLE_RAD;
      const flat = Math.sqrt(t);
      out.push(
        new Vector3(
          domeR * flat * Math.cos(theta),
          baseY + domeH * (1 - t),
          domeR * flat * Math.sin(theta),
        ),
      );
    }
    return out;
  }, [domeR, domeH]);

  return (
    <>
      <PerspectiveCamera makeDefault position={[8, 6, 8]} fov={36} />
      <ambientLight intensity={0.9} />
      <SpineLine points={candidates} />
      {candidates.map((p, i) => (
        <mesh key={i} position={[p.x, p.y, p.z]}>
          <sphereGeometry args={[0.07, 10, 10]} />
          <meshBasicMaterial color="#9d174d" />
        </mesh>
      ))}
      <OrbitControls target={[0, baseY + domeH * 0.3, 0]} enablePan={false} minDistance={2} maxDistance={20} />
    </>
  );
}

function Tube({
  curve,
  mat,
}: {
  curve: ReturnType<typeof makeBendableStemCurve>;
  mat: ReturnType<typeof createRisoStemMaterial>;
}) {
  const geom = useMemo(() => new TubeGeometry(curve, 24, 0.022, 8, false), [curve]);
  return <mesh geometry={geom} material={mat} />;
}

/* ──────────────────────────────────────────────────────────────────────────
   FlowerHead component is defined in flowers/index.tsx but importing it
   pulls in r3f/three through the entire bouquet runtime. We re-export it
   via a small dynamic loader so the explainer doesn't drag the home page
   into its bundle.
   ─────────────────────────────────────────────────────────────────────── */

function useFlowerHeadComponent() {
  // The FlowerHead React component lives in the main flowers module.
  // We import lazily so the initial /explainer payload stays small.
  const [Cmp, setCmp] = useState<((props: { flower: Flower }) => ReactNode) | null>(null);
  useEffect(() => {
    let cancelled = false;
    import("@/flowers/index").then((m) => {
      if (cancelled) return;
      setCmp(() => m.FlowerHead);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  if (!Cmp) {
    return function Placeholder() {
      return null;
    };
  }
  return Cmp;
}

/* ──────────────────────────────────────────────────────────────────────────
   Section header
   ─────────────────────────────────────────────────────────────────────── */

function SectionHeader({ index, title }: { index: string; title: string }) {
  return (
    <div>
      <p className="text-xs font-mono uppercase tracking-widest text-emerald-700">
        {index}
      </p>
      <h2 className="mt-1 font-instrument text-3xl font-bold">{title}</h2>
    </div>
  );
}
