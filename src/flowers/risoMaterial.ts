import { Color, MeshStandardMaterial } from "three";
import type { FlowerType } from "./schema";

export type RisoPalette = {
  inks: string[];
  paper: string;
};

const FALLBACK: RisoPalette = {
  inks: ["#ff2d5a", "#0050ff", "#ffd23a"],
  paper: "#fff8e7",
};

export const FLOWER_PALETTES: Record<FlowerType, RisoPalette> = {
  rose:           { inks: ["#ff2d5a", "#9a1a3a", "#ffd23a"], paper: "#fff5e8" },
  tulip:          { inks: ["#ff7a90", "#ffd23a", "#3a4fb0"], paper: "#fff8e7" },
  sunflower:      { inks: ["#ffb800", "#7a4a10", "#ff5e7a"], paper: "#fff7d6" },
  daisy:          { inks: ["#fbfbfb", "#ffd23a", "#3a4fb0"], paper: "#fff8e7" },
  lavender:       { inks: ["#9b6dff", "#3a4fb0", "#ff8aa6"], paper: "#fbf3ff" },
  peony:          { inks: ["#ff8aa6", "#c2125c", "#fff3e0"], paper: "#fff5ec" },
  "babys-breath": { inks: ["#fdfbf6", "#cfe7ff", "#3a4fb0"], paper: "#fbf3e0" },
  hydrangea:      { inks: ["#7fd6e2", "#3d7eff", "#ff8aa6"], paper: "#f3fbff" },
  carnation:      { inks: ["#3d7eff", "#0a2a8c", "#ffd23a"], paper: "#fff8e7" },
  lily:           { inks: ["#fffbe8", "#ffd23a", "#c97a2a"], paper: "#fff8e7" },
  iris:           { inks: ["#3a4fb0", "#1a1158", "#ffd23a"], paper: "#f0eaff" },
  chrysanthemum:  { inks: ["#ffd23a", "#ff8a3a", "#7a3a10"], paper: "#fffaeb" },
};

const RISO_FRAG_PRELUDE = /* glsl */ `
#define RISO_INK_COUNT 3
uniform vec3 uRisoInks[RISO_INK_COUNT];
uniform vec3 uRisoPaper;
uniform float uRisoGrain;
uniform float uRisoGrainScale;
uniform float uRisoPosterize;
uniform float uRisoDither;
uniform float uRisoMisreg;

vec3 riso_mod289v3(vec3 x){return x - floor(x * (1.0/289.0)) * 289.0;}
vec2 riso_mod289v2(vec2 x){return x - floor(x * (1.0/289.0)) * 289.0;}
vec3 riso_permute(vec3 x){return riso_mod289v3(((x*34.0)+1.0)*x);}
float riso_snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                     -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1; i1 = (x0.x > x0.y) ? vec2(1.0,0.0) : vec2(0.0,1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = riso_mod289v2(i);
  vec3 p = riso_permute(riso_permute(i.y + vec3(0.0, i1.y, 1.0))
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

float riso_bayer(vec2 p) {
  int x = int(mod(p.x, 4.0));
  int y = int(mod(p.y, 4.0));
  int idx = x + y * 4;
  float m[16];
  m[0]=0.0;  m[1]=8.0;  m[2]=2.0;  m[3]=10.0;
  m[4]=12.0; m[5]=4.0;  m[6]=14.0; m[7]=6.0;
  m[8]=3.0;  m[9]=11.0; m[10]=1.0; m[11]=9.0;
  m[12]=15.0;m[13]=7.0; m[14]=13.0;m[15]=5.0;
  return (m[idx] + 0.5) / 16.0 - 0.5;
}

float riso_quant(float v, vec2 p) {
  float d = riso_bayer(p) * uRisoDither;
  return clamp(floor((v + d) * uRisoPosterize) / uRisoPosterize, 0.0, 1.0);
}

float riso_inkStrength(vec3 color, vec3 ink) {
  vec3 deficit = uRisoPaper - color;
  vec3 axis = uRisoPaper - ink;
  float denom = max(dot(axis, axis), 1e-4);
  return clamp(dot(deficit, axis) / denom, 0.0, 1.0);
}

vec3 riso_apply(vec3 inputColor, vec2 fragPx) {
  vec3 col = uRisoPaper;
  for (int i = 0; i < RISO_INK_COUNT; i++) {
    vec3 ink = uRisoInks[i];
    float s = riso_inkStrength(inputColor, ink);

    float a = float(i) * 2.094;
    vec2 offset = vec2(cos(a), sin(a)) * uRisoMisreg;
    vec2 gp = (fragPx + offset) / max(uRisoGrainScale, 0.5);

    float n = riso_snoise(gp + float(i) * 17.31) * 0.5 + 0.5;
    float strength = s + (n - 0.5) * uRisoGrain;
    float q = riso_quant(strength, floor(fragPx) + float(i) * 7.0);

    col *= mix(vec3(1.0), ink / max(uRisoPaper, vec3(0.001)), q);
  }
  return col;
}
`;

export type RisoOverrides = {
  grain?: number;
  grainScale?: number;
  misregistration?: number;
  posterize?: number;
  ditherStrength?: number;
};

// Single shared uniform set. Mutating these values updates every cached
// material in place — no rebuild, no recompile.
const sharedUniforms = {
  uRisoGrain: { value: 0.55 },
  uRisoGrainScale: { value: 1.6 },
  uRisoMisreg: { value: 1.4 },
  uRisoPosterize: { value: 4 },
  uRisoDither: { value: 0.6 },
};

export function setRisoUniforms(overrides: RisoOverrides) {
  if (overrides.grain !== undefined) sharedUniforms.uRisoGrain.value = overrides.grain;
  if (overrides.grainScale !== undefined) sharedUniforms.uRisoGrainScale.value = overrides.grainScale;
  if (overrides.misregistration !== undefined) sharedUniforms.uRisoMisreg.value = overrides.misregistration;
  if (overrides.posterize !== undefined) sharedUniforms.uRisoPosterize.value = overrides.posterize;
  if (overrides.ditherStrength !== undefined) sharedUniforms.uRisoDither.value = overrides.ditherStrength;
}

// Cache: one material per (baseColor, palette identity, doubleSide).
const materialKeyCache = new Map<string, MeshStandardMaterial>();

function paletteKey(palette: RisoPalette): string {
  return `${palette.paper}|${palette.inks.join(",")}`;
}

export function createRisoPetalMaterial({
  baseColor,
  palette,
  doubleSide = true,
}: {
  baseColor: string;
  palette: RisoPalette;
  doubleSide?: boolean;
  // Legacy params accepted for back-compat but ignored — uniforms are global.
  grain?: number;
  grainScale?: number;
  misregistration?: number;
  posterize?: number;
  ditherStrength?: number;
}): MeshStandardMaterial {
  const key = `${baseColor}|${paletteKey(palette)}|${doubleSide ? "ds" : "fs"}`;
  const cached = materialKeyCache.get(key);
  if (cached) return cached;

  const inks = (palette.inks.length === 3
    ? palette.inks
    : [...palette.inks, ...FALLBACK.inks].slice(0, 3)
  ).map((hex) => new Color(hex));
  const paperColor = new Color(palette.paper);

  const mat = new MeshStandardMaterial({
    color: new Color(baseColor),
    roughness: 1,
    metalness: 0,
    flatShading: true,
    side: doubleSide ? 2 : 0,
  });

  mat.onBeforeCompile = (shader) => {
    // Constants for this material (palette/inks)
    shader.uniforms.uRisoInks = { value: inks };
    shader.uniforms.uRisoPaper = { value: paperColor };
    // Mutable globals (shared across all cached materials)
    shader.uniforms.uRisoGrain = sharedUniforms.uRisoGrain;
    shader.uniforms.uRisoGrainScale = sharedUniforms.uRisoGrainScale;
    shader.uniforms.uRisoMisreg = sharedUniforms.uRisoMisreg;
    shader.uniforms.uRisoPosterize = sharedUniforms.uRisoPosterize;
    shader.uniforms.uRisoDither = sharedUniforms.uRisoDither;

    shader.fragmentShader = RISO_FRAG_PRELUDE + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <dithering_fragment>",
      `
        #include <dithering_fragment>
        gl_FragColor.rgb = riso_apply(gl_FragColor.rgb, gl_FragCoord.xy);
      `,
    );
  };

  materialKeyCache.set(key, mat);
  return mat;
}

export function getFlowerPalette(type: FlowerType): RisoPalette {
  return FLOWER_PALETTES[type] ?? FALLBACK;
}

export const STEM_PALETTE: RisoPalette = {
  inks: ["#9bbf7e", "#c5dca8", "#7fa66a"],
  paper: "#fbf3e0",
};

export function createRisoStemMaterial(
  baseColor = "#a8c98a",
  // Accepted for back-compat; ignored — uniforms are global now.
  _overrides: RisoOverrides = {},
): MeshStandardMaterial {
  return createRisoPetalMaterial({
    baseColor,
    palette: STEM_PALETTE,
    doubleSide: false,
  });
}
