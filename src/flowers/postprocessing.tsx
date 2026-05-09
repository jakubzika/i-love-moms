"use client";

import { forwardRef, useMemo } from "react";
import { Effect } from "postprocessing";
import { Uniform, Color } from "three";
import { EffectComposer } from "@react-three/postprocessing";

const ditherFrag = /* glsl */ `
  uniform float scale;
  uniform float strength;

  // 4x4 Bayer matrix
  float bayer4(vec2 p) {
    int x = int(mod(p.x, 4.0));
    int y = int(mod(p.y, 4.0));
    int idx = x + y * 4;
    float m[16];
    m[0]  =  0.0; m[1]  =  8.0; m[2]  =  2.0; m[3]  = 10.0;
    m[4]  = 12.0; m[5]  =  4.0; m[6]  = 14.0; m[7]  =  6.0;
    m[8]  =  3.0; m[9]  = 11.0; m[10] =  1.0; m[11] =  9.0;
    m[12] = 15.0; m[13] =  7.0; m[14] = 13.0; m[15] =  5.0;
    return m[idx] / 16.0 - 0.5;
  }

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec2 p = floor(uv * resolution / max(1.0, scale));
    float t = bayer4(p) * strength;
    vec3 color = inputColor.rgb + t;
    // quantize to 4 levels per channel
    color = floor(color * 4.0 + 0.5) / 4.0;
    outputColor = vec4(color, inputColor.a);
  }
`;

class DitherEffect extends Effect {
  constructor({ scale = 2, strength = 0.4 } = {}) {
    super("DitherEffect", ditherFrag, {
      uniforms: new Map<string, Uniform<unknown>>([
        ["scale", new Uniform(scale)],
        ["strength", new Uniform(strength)],
      ]),
    });
  }
}

const Dither = forwardRef<DitherEffect, { scale?: number; strength?: number }>(
  function Dither({ scale = 2, strength = 0.4 }, ref) {
    const effect = useMemo(() => new DitherEffect({ scale, strength }), [scale, strength]);
    return <primitive ref={ref} object={effect} dispose={null} />;
  },
);

const risoFrag = /* glsl */ `
  uniform vec3 inkA;       // ink layer 1 (e.g. fluorescent pink)
  uniform vec3 inkB;       // ink layer 2 (e.g. medium blue)
  uniform vec3 inkC;       // ink layer 3 (e.g. yellow)
  uniform vec3 paper;      // paper color
  uniform float grain;     // grain strength
  uniform float grainScale;// grain texel size in screen px
  uniform float misregistration; // per-layer screen shift in px
  uniform float posterize; // tonal steps per channel (1 = on/off, 4 = soft)
  uniform float ditherStrength;

  // Simplex noise (Ashima)
  vec3 mod289(vec3 x){return x - floor(x * (1.0/289.0)) * 289.0;}
  vec2 mod289(vec2 x){return x - floor(x * (1.0/289.0)) * 289.0;}
  vec3 permute(vec3 x){return mod289(((x*34.0)+1.0)*x);}
  float snoise(vec2 v){
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1; i1 = (x0.x > x0.y) ? vec2(1.0,0.0) : vec2(0.0,1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m; m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g; g.x = a0.x*x0.x + h.x*x0.y;
    g.yz = a0.yz*x12.xz + h.yz*x12.yw;
    return 130.0 * dot(m, g);
  }

  // 4x4 Bayer dither for posterization, breaks up flat bands
  float bayer(vec2 p) {
    int x = int(mod(p.x, 4.0));
    int y = int(mod(p.y, 4.0));
    int idx = x + y * 4;
    float m[16];
    m[0]  =  0.0; m[1]  =  8.0; m[2]  =  2.0; m[3]  = 10.0;
    m[4]  = 12.0; m[5]  =  4.0; m[6]  = 14.0; m[7]  =  6.0;
    m[8]  =  3.0; m[9]  = 11.0; m[10] =  1.0; m[11] =  9.0;
    m[12] = 15.0; m[13] =  7.0; m[14] = 13.0; m[15] =  5.0;
    return (m[idx] + 0.5) / 16.0 - 0.5;
  }

  // Soft-quantize a 0..1 value to N steps with Bayer dithering applied first.
  float softQuant(float v, vec2 p, float steps) {
    float d = bayer(p) * ditherStrength;
    return clamp(floor((v + d) * steps + 0.0) / steps, 0.0, 1.0);
  }

  // Layer strengths derived from chromaticity. Boosted contrast: each axis
  // is amplified and sharpened so mid-tones quantize cleanly into ink levels.
  float layerStrength(vec3 c, int layer) {
    float lum = dot(c, vec3(0.299, 0.587, 0.114));
    float dark = pow(1.0 - lum, 1.4);
    float v;
    if (layer == 0) {
      // pink/magenta: red minus the rest
      v = (c.r - 0.55 * (c.g + c.b)) * 2.2 + dark * 0.55;
    } else if (layer == 1) {
      // blue: blue minus the rest
      v = (c.b - 0.55 * (c.r + c.g)) * 2.4 + dark * 0.65;
    } else {
      // yellow: warmth (r+g) minus blue
      v = (0.5 * (c.r + c.g) - c.b * 0.7) * 1.8 - 0.05;
    }
    // sharpen mid-tones — push contrast hard so layers separate
    v = clamp(v, 0.0, 1.0);
    v = smoothstep(0.05, 0.85, v);
    return v;
  }

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec2 res = resolution;

    // Per-layer screen shifts (the iconic riso misregistration)
    vec2 oA = vec2( misregistration,        0.0) / res;
    vec2 oB = vec2(-0.5 * misregistration, -0.9 * misregistration) / res;
    vec2 oC = vec2( 0.3 * misregistration,  1.0 * misregistration) / res;

    // We can't actually re-sample the scene from inside an Effect's mainImage
    // without sampling inputBuffer, but inputColor only gives us this pixel.
    // We work with the same color and offset the *grain* per layer instead.
    vec3 c = inputColor.rgb;

    // Layer strengths
    float sA = layerStrength(c, 0);
    float sB = layerStrength(c, 1);
    float sC = layerStrength(c, 2);

    // Per-layer simplex grain offset by each layer's misregistration vector.
    // Different scales per layer so the screens don't moire.
    vec2 gp = uv * res / max(grainScale, 0.5);
    float nA = snoise(gp + oA * res * 4.0) * 0.5 + 0.5;
    float nB = snoise((gp + oB * res * 4.0) * 0.93 + 17.0) * 0.5 + 0.5;
    float nC = snoise((gp + oC * res * 4.0) * 1.07 + 53.0) * 0.5 + 0.5;

    // Posterize each layer with Bayer dithering — gives the soft grainy
    // "ink absorption" gradient riso is known for.
    vec2 bp = floor(uv * res / 1.0);
    float qA = softQuant(sA + (nA - 0.5) * grain, bp,           posterize);
    float qB = softQuant(sB + (nB - 0.5) * grain, bp + vec2(7), posterize);
    float qC = softQuant(sC + (nC - 0.5) * grain, bp + vec2(13), posterize);

    // Multiplicative overprint on paper. Each ink subtracts toward its color.
    vec3 col = paper;
    col *= mix(vec3(1.0), inkA / max(paper, vec3(0.001)), qA);
    col *= mix(vec3(1.0), inkB / max(paper, vec3(0.001)), qB);
    col *= mix(vec3(1.0), inkC / max(paper, vec3(0.001)), qC);

    outputColor = vec4(col, inputColor.a);
  }
`;

class RisoEffect extends Effect {
  constructor({
    inkA = new Color("#ff2d5a"),
    inkB = new Color("#0050ff"),
    inkC = new Color("#ffd23a"),
    paper = new Color("#fff8e7"),
    grain = 0.45,
    grainScale = 1.5,
    misregistration = 2.5,
    posterize = 4,
    ditherStrength = 0.6,
  } = {}) {
    super("RisoEffect", risoFrag, {
      uniforms: new Map<string, Uniform<unknown>>([
        ["inkA", new Uniform(inkA)],
        ["inkB", new Uniform(inkB)],
        ["inkC", new Uniform(inkC)],
        ["paper", new Uniform(paper)],
        ["grain", new Uniform(grain)],
        ["grainScale", new Uniform(grainScale)],
        ["misregistration", new Uniform(misregistration)],
        ["posterize", new Uniform(posterize)],
        ["ditherStrength", new Uniform(ditherStrength)],
      ]),
    });
  }
}

const Riso = forwardRef<
  RisoEffect,
  {
    inkA?: string;
    inkB?: string;
    inkC?: string;
    paper?: string;
    grain?: number;
    grainScale?: number;
    misregistration?: number;
    posterize?: number;
    ditherStrength?: number;
  }
>(function Riso(
  {
    inkA = "#ff2d5a",
    inkB = "#0050ff",
    inkC = "#ffd23a",
    paper = "#fff8e7",
    grain = 0.45,
    grainScale = 1.5,
    misregistration = 2.5,
    posterize = 4,
    ditherStrength = 0.6,
  },
  ref,
) {
  const effect = useMemo(
    () =>
      new RisoEffect({
        inkA: new Color(inkA),
        inkB: new Color(inkB),
        inkC: new Color(inkC),
        paper: new Color(paper),
        grain,
        grainScale,
        misregistration,
        posterize,
        ditherStrength,
      }),
    [inkA, inkB, inkC, paper, grain, grainScale, misregistration, posterize, ditherStrength],
  );
  return <primitive ref={ref} object={effect} dispose={null} />;
});

export type PostFxPreset = "off" | "riso";

export const POSTFX_OPTIONS: PostFxPreset[] = ["off", "riso"];

export type RisoConfig = {
  inkA?: string;
  inkB?: string;
  inkC?: string;
  paper?: string;
  grain?: number;
  grainScale?: number;
  misregistration?: number;
  posterize?: number;
  ditherStrength?: number;
};

export function PostFx({
  preset,
  riso,
}: {
  preset: PostFxPreset;
  riso?: RisoConfig;
}) {
  if (preset === "off") return null;
  return (
    <EffectComposer>
      <Riso
        inkA={riso?.inkA ?? "#ff2d5a"}
        inkB={riso?.inkB ?? "#0050ff"}
        inkC={riso?.inkC ?? "#ffd23a"}
        paper={riso?.paper ?? "#fff8e7"}
        grain={riso?.grain ?? 0.4}
        grainScale={riso?.grainScale ?? 1.5}
        misregistration={riso?.misregistration ?? 2.5}
        posterize={riso?.posterize ?? 4}
        ditherStrength={riso?.ditherStrength ?? 0.55}
      />
    </EffectComposer>
  );
}
