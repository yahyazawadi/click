// ─────────────────────────────────────────────────────────────────────────────
//  HIGH-TIER NEBULA ITERATION PATHS
//  Change NEBULA_PATH (0–3) to switch between visual experiments.
//  Save the file — Vite hot-reloads instantly. No deploy needed.
//
//  0  SILKY WISPS       — current natural look: single warp + micro-filaments
//  1  DEEP OCEAN PILLARS — second-pass warp blended softly, like cumulonimbus
//  2  ORION RIBBON       — asymmetric curl + radial stretch, like emission bow
//  3  BIOLUMINESCENT VEINS — tight sinusoidal filament lattice inside the gas
// ─────────────────────────────────────────────────────────────────────────────
const NEBULA_PATH = 0;

// ─── HIGH-TIER GLSL SNIPPETS — one is injected at runtime based on NEBULA_PATH ───
// All paths take: uv, uWarp, uTime, fbm()  →  write float density, float qLen

const HIGH_PATH_SNIPPETS = [

  /* ── PATH 0 : SILKY WISPS ──────────────────────────────────────────────────
     Natural baseline: smooth single domain-warp + delicate micro-filaments
     blended only where gas is dense. Very clean organic look.               */
  `
    // PATH 0 — Silky Wisps
    vec2 q0;
    q0.x = fbm(uv + vec2(0.0, uTime * 0.018));
    q0.y = fbm(uv + vec2(5.2, uTime * 0.013));
    qLen = length(q0);
    float base0     = fbm(uv + uWarp * q0);
    float filament0 = fbm(uv * 2.4 + q0 * 0.4) * 0.18;
    density = base0 + filament0 * smoothstep(0.1, 0.7, base0);
  `,

  /* ── PATH 1 : DEEP OCEAN PILLARS ───────────────────────────────────────────
     Two soft domain-warp passes at very different speeds. Second pass is
     blended gently (not full strength) so you get depth without chaos.
     Feels like cumulonimbus or undersea thermal vents.                       */
  `
    // PATH 1 — Deep Ocean Pillars
    vec2 q1;
    q1.x = fbm(uv + vec2(0.0,  uTime * 0.014));
    q1.y = fbm(uv + vec2(3.7,  uTime * 0.010));
    qLen = length(q1);
    vec2 r1;
    r1.x = fbm(uv + uWarp * q1 * 0.65 + vec2(2.1, uTime * 0.007));
    r1.y = fbm(uv + uWarp * q1 * 0.65 + vec2(7.4, uTime * 0.009));
    float base1 = fbm(uv + uWarp * q1);
    float deep1 = fbm(uv + uWarp * r1 * 0.5);
    density = mix(base1, deep1, 0.32);  // soft blend — no muddy double-warp
  `,

  /* ── PATH 2 : ORION RIBBON ─────────────────────────────────────────────────
     Asymmetric angular curl + a radial bow-stretch modulator. The warp
     vector is rotated by a slow angle offset, creating an elongated ribbon
     arc like an emission bow-shock or an Orion Nebula shard.                 */
  `
    // PATH 2 — Orion Ribbon
    float bowAngle = uTime * 0.006;
    mat2 bowRot = mat2(cos(bowAngle), -sin(bowAngle), sin(bowAngle), cos(bowAngle));
    vec2 q2;
    q2.x = fbm(bowRot * uv + vec2(0.0, uTime * 0.016));
    q2.y = fbm(bowRot * uv + vec2(6.1, uTime * 0.011));
    qLen = length(q2);
    // Radial bow stretch: density falls off perpendicular to ribbon axis
    float ribbonMask = 1.0 - smoothstep(0.0, 0.55, abs(uv.y * 0.7 - uv.x * 0.3));
    float base2 = fbm(uv + uWarp * q2);
    density = base2 * (0.7 + 0.3 * ribbonMask);
  `,

  /* ── PATH 3 : BIOLUMINESCENT VEINS ─────────────────────────────────────────
     Sinusoidal lattice carved through the warp density field. Creates a
     glowing vein network inside the gas cloud — like deep ocean creatures
     or branching plasma threads. Stays natural because veins only glow
     where gas already exists (masked by baseDensity).                        */
  `
    // PATH 3 — Bioluminescent Veins
    vec2 q3;
    q3.x = fbm(uv + vec2(0.0, uTime * 0.018));
    q3.y = fbm(uv + vec2(5.2, uTime * 0.013));
    qLen = length(q3);
    float base3 = fbm(uv + uWarp * q3);
    // Vein lattice: sinusoidal crosshatch in warped space
    vec2 veinUv = uv * 4.5 + q3 * 1.2;
    float veinX  = abs(sin(veinUv.x * 3.14159));
    float veinY  = abs(sin(veinUv.y * 3.14159 + 1.1));
    float veins  = pow(max(veinX, veinY), 6.0) * 0.22;
    // Only glow where gas is present (mask veins to dense regions)
    density = base3 + veins * smoothstep(0.2, 0.75, base3);
  `,
];

import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

export const NebulaMaterial = shaderMaterial(
  {
    uTime: 0,
    uPerfTier: 0.0,     // 0.0=high (full quality), 0.5=med (skip r-warp), 1.0=low (1 FBM pass)
    // Hubble SHO palette: Sulfur-II → H-alpha → OIII
    uColorSII:  new THREE.Color('#ff4500'), // Sulfur-II  — warm orange-red (SII emission 673nm)
    uColorHa:   new THREE.Color('#c0001a'), // H-alpha    — deep crimson  (Ha  emission 656nm)
    uColorOIII: new THREE.Color('#00b4c8'), // OIII       — ionized teal  (OIII emission 501nm)
    uColorCore: new THREE.Color('#ffe8c0'), // Hot core   — near-white yellow (ionization front)
    uScale: 3.5,
    uWarp: 2.5,
    uMaskRadius: 0.38,
    uEdgeWarp: 0.25,
    uParallaxOffset: new THREE.Vector2(0, 0),
    uAlpha: 1.0,
    uBrightness: 2.2,
    uDustStrength: 0.55,
    uPillarStrength: 0.6,
    uCoreRadius: 0.18,
    uStarCount: 12.0,    // number of embedded young stars per nebula
    uGlowRadius: 0.32,   // volumetric halo radius (0..0.5)
    uNebulaPath: 0,      // DEV: 0=Silky Wisps  1=Deep Ocean  2=Orion Ribbon  3=Bioluminescent Veins
  },
  // Vertex Shader
  /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment Shader — Full Realistic Nebula with Stars + Volumetric Glow
  // Uses template literal so NEBULA_PATH can be interpolated at module load time
  /* glsl */ `
    uniform float uTime;
    uniform float uPerfTier;  // 0.0=high, 0.5=med, 1.0=low
    uniform int   uNebulaPath; // 0–3, selects HIGH-tier formula at runtime
    uniform vec3 uColorSII;
    uniform vec3 uColorHa;
    uniform vec3 uColorOIII;
    uniform vec3 uColorCore;
    uniform float uScale;
    uniform float uWarp;
    uniform float uMaskRadius;
    uniform float uEdgeWarp;
    uniform vec2 uParallaxOffset;
    uniform float uAlpha;
    uniform float uBrightness;
    uniform float uDustStrength;
    uniform float uPillarStrength;
    uniform float uCoreRadius;
    uniform float uStarCount;
    uniform float uGlowRadius;

    varying vec2 vUv;

    // --- Noise ---
    vec2 hash2(vec2 p) {
      p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
      return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
    }
    float hash1(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(dot(hash2(i + vec2(0.0,0.0)), f - vec2(0.0,0.0)),
            dot(hash2(i + vec2(1.0,0.0)), f - vec2(1.0,0.0)), u.x),
        mix(dot(hash2(i + vec2(0.0,1.0)), f - vec2(0.0,1.0)),
            dot(hash2(i + vec2(1.0,1.0)), f - vec2(1.0,1.0)), u.x),
        u.y
      );
    }

    // FBM — octave count driven by uPerfTier:
    //   high (< 0.3) → 3 octaves
    //   med  (< 0.8) → 2 octaves
    //   low  (>= 0.8)→ 1 octave
    float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      mat2 rot = mat2(0.80, 0.60, -0.60, 0.80);
      int count = uPerfTier < 0.3 ? 3 : (uPerfTier < 0.8 ? 2 : 1);
      for (int i = 0; i < 3; i++) {
        if (i >= count) break;
        v += a * noise(p);
        p  = rot * p * 2.07 + vec2(13.4, 27.9);
        a *= 0.48;
      }
      return v;
    }

    // Dust FBM — 2 octaves on high/med, 1 on low
    float dustFbm(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      mat2 rot = mat2(0.62, 0.78, -0.78, 0.62);
      int count = uPerfTier < 0.8 ? 2 : 1;
      for (int i = 0; i < 2; i++) {
        if (i >= count) break;
        v += a * noise(p);
        p  = rot * p * 1.97 + vec2(4.1, 51.3);
        a *= 0.52;
      }
      return v * 0.5 + 0.5;
    }

    // Pillar column density ridge
    float pillar(vec2 baseUv, vec2 dir, float thickness, float len) {
      vec2 n = vec2(-dir.y, dir.x);
      float along = dot(baseUv, dir);
      float perp  = dot(baseUv, n);
      return smoothstep(thickness, 0.0, abs(perp))
           * smoothstep(0.0, 0.3, along)
           * smoothstep(len, len * 0.4, along);
    }

    // Embedded young star field — scattered bright pinpoints inside nebula
    // Uses a grid-based approach: check only 4 cells (faster than 9 neighbor check)
    float starField(vec2 uv, float count, float time) {
      float result = 0.0;
      vec2 cell = floor(uv * count);
      for (int dx = 0; dx <= 1; dx++) {
        for (int dy = 0; dy <= 1; dy++) {
          vec2 neighborCell = cell + vec2(float(dx), float(dy));
          vec2 starPos = (neighborCell + 0.5 + 0.45 * hash2(neighborCell + vec2(13.7, 29.3))) / count;
          float starDist = length(uv / count - starPos);
          float presence = step(0.7, hash1(neighborCell + vec2(7.3, 41.9)));
          float twinkle = 0.8 + 0.2 * sin(time * 3.0 + hash1(neighborCell) * 6.28318);
          float disk = smoothstep(0.0008, 0.0, starDist);
          float halo = exp(-starDist * 280.0) * 0.4;
          result += presence * twinkle * (disk + halo);
        }
      }
      return clamp(result, 0.0, 1.0);
    }

    // Volumetric scatter glow — soft halo around the densest gas regions
    // Approximated as a blurred version of density (implemented as distance-based radial falloff
    // centered at nebula "bright spots" found via coarse fbm)
    float volumetricGlow(vec2 centeredUv, float density, float glowRadius) {
      float radial = 1.0 - smoothstep(0.0, glowRadius, length(centeredUv));
      // Glow is strong where density is high, falls off radially from center
      return pow(radial, 1.5) * pow(density, 0.6) * 0.5;
    }

    void main() {
      vec2 centeredUv = vUv - vec2(0.5);

      // 1. Radial plane edge kill
      float edgeDist = length(centeredUv);
      float planeEdgeFade = smoothstep(0.45, 0.15, edgeDist);

      // 2. Organic boundary mask
      float angle   = atan(centeredUv.y, centeredUv.x);
      float edgeN   = fbm(vec2(angle * 2.5, uTime * 0.012) + centeredUv * 2.0) * uEdgeWarp;
      float organicMask = smoothstep(uMaskRadius, uMaskRadius * 0.1, edgeDist + edgeN);

      // 3. Domain-warped gas density
      //   HIGH: full 5-pass warp (q → r → density)
      //   MED:  3-pass warp (q → density, skip r)
      //   LOW:  1-pass direct fbm (no warp)
      vec2 uv = centeredUv * uScale + uParallaxOffset;
      float density;
      float qLen = 0.0;

      if (uPerfTier < 0.3) {
        // ── HIGH tier: runtime path selected by uNebulaPath uniform (0–3) ──
        if (uNebulaPath == 0) {
          // PATH 0 — Silky Wisps: single warp + delicate micro-filaments
          vec2 q0;
          q0.x = fbm(uv + vec2(0.0, uTime * 0.018));
          q0.y = fbm(uv + vec2(5.2, uTime * 0.013));
          qLen = length(q0);
          float base0 = fbm(uv + uWarp * q0);
          float filament0 = fbm(uv * 2.4 + q0 * 0.4) * 0.18;
          density = base0 + filament0 * smoothstep(0.1, 0.7, base0);

        } else if (uNebulaPath == 1) {
          // PATH 1 — Deep Ocean Pillars v2
          // Two independent warp fields at different speeds give layered depth.
          // A low-frequency envelope floor eliminates gaps by ensuring the cloud
          // never hits zero in both layers simultaneously. A third micro-detail
          // pass targets the Ha density range to enrich the crimson-to-violet gradient.
          vec2 q1;
          q1.x = fbm(uv + vec2(0.0,  uTime * 0.014));
          q1.y = fbm(uv + vec2(3.7,  uTime * 0.010));
          qLen = length(q1);
          vec2 r1;
          r1.x = fbm(uv + uWarp * q1 * 0.65 + vec2(2.1, uTime * 0.007));
          r1.y = fbm(uv + uWarp * q1 * 0.65 + vec2(7.4, uTime * 0.009));
          float base1  = fbm(uv + uWarp * q1);
          float deep1  = fbm(uv + uWarp * r1 * 0.5);
          // Envelope: large-scale low-frequency cloud fills in structural gaps
          float envelope1 = fbm(uv * 0.55 + vec2(3.1, uTime * 0.004)) * 0.22 + 0.08;
          float blend1 = mix(base1, deep1, 0.32);
          // Micro-detail: targets mid-density range (Ha→SII crimson transition)
          float micro1 = fbm(uv * 3.1 + q1 * 0.55 + vec2(uTime * 0.005)) * 0.12;
          density = max(blend1 + micro1 * smoothstep(0.25, 0.65, blend1), envelope1);

        } else if (uNebulaPath == 2) {
          // PATH 2 — Orion Ribbon: slow rotating bow-shock arc
          float bowAngle = uTime * 0.006;
          mat2 bowRot = mat2(cos(bowAngle), -sin(bowAngle), sin(bowAngle), cos(bowAngle));
          vec2 q2;
          q2.x = fbm(bowRot * uv + vec2(0.0, uTime * 0.016));
          q2.y = fbm(bowRot * uv + vec2(6.1, uTime * 0.011));
          qLen = length(q2);
          float ribbonMask = 1.0 - smoothstep(0.0, 0.55, abs(uv.y * 0.7 - uv.x * 0.3));
          float base2 = fbm(uv + uWarp * q2);
          density = base2 * (0.7 + 0.3 * ribbonMask);

        } else if (uNebulaPath == 3) {
          // PATH 3 — Organic Plasma Filaments v2
          // Replaces the mathematical sin() crosshatch with FBM-ridge filaments
          // warped by the gas flow itself. Two crossing ridge families at different
          // scales and orientations create branching, non-repeating plasma threads.
          // A base cloud underneath stops filaments from floating on nothing.
          vec2 q3;
          q3.x = fbm(uv + vec2(0.0, uTime * 0.018));
          q3.y = fbm(uv + vec2(5.2, uTime * 0.013));
          qLen = length(q3);
          float base3 = fbm(uv + uWarp * q3);
          // Warp filament space by gas flow so threads follow the cloud shape
          vec2 fUv = uv * 5.8 + q3 * 2.1 + vec2(uTime * 0.0035, uTime * 0.0028);
          // Primary filament family: FBM ridge sharpened into a bright thread
          float ridgeA = fbm(fUv);
          float threadA = pow(1.0 - abs(ridgeA - 0.48) * 3.8, 5.0);
          threadA = max(0.0, threadA) * 0.30;
          // Secondary filament family: rotated 50° so threads cross organically
          vec2 fUvB = fUv.yx * vec2(0.64, 1.0) + vec2(8.3, 2.7);
          float ridgeB = fbm(fUvB + vec2(uTime * 0.0022));
          float threadB = pow(1.0 - abs(ridgeB - 0.52) * 4.2, 5.0);
          threadB = max(0.0, threadB) * 0.18;
          // Filaments only glow inside the gas cloud (masked to dense regions)
          float filaments3 = (threadA + threadB) * smoothstep(0.12, 0.62, base3);
          // Blend: rich cloud base + glowing plasma threads on top
          density = base3 * 0.72 + filaments3;

        } else if (uNebulaPath == 4) {
          // PATH 4 — Polar Vortex: gas in rotating spiral polar coordinates
          // The density field lives in angle-radius space and slowly rotates,
          // creating a swirling galactic-arm cross-section feel.
          float r4 = length(uv);
          float theta4 = atan(uv.y, uv.x) + uTime * 0.022;
          // Logarithmic spiral: convert back to Cartesian in spiral space
          vec2 spiralUv = vec2(r4 * cos(theta4 * 1.4 + r4), r4 * sin(theta4 * 1.4 + r4));
          vec2 q4;
          q4.x = fbm(spiralUv + vec2(0.0, uTime * 0.011));
          q4.y = fbm(spiralUv + vec2(4.1, uTime * 0.008));
          qLen = length(q4);
          float base4 = fbm(spiralUv + uWarp * q4 * 0.75);
          // Radial fade: denser in mid-radii (avoids hard center/edge)
          float radialBias4 = smoothstep(0.05, 0.25, r4) * smoothstep(0.7, 0.3, r4);
          density = base4 * (0.6 + 0.4 * radialBias4);

        } else if (uNebulaPath == 5) {
          // PATH 5 — Emission Shell: hollow ring like a planetary nebula
          // Peak density sits on a distorted spherical shell, not the center.
          // Inner glow + outer halo give it layered depth like the Ring Nebula.
          vec2 q5;
          q5.x = fbm(uv + vec2(0.0, uTime * 0.015));
          q5.y = fbm(uv + vec2(6.3, uTime * 0.011));
          qLen = length(q5);
          float r5 = length(uv + q5 * 0.18);
          float shell5 = exp(-pow((r5 - 0.22) * 7.5, 2.0)) * 0.55;
          float core5  = exp(-r5 * r5 * 14.0) * 0.20;
          float halo5  = exp(-pow((r5 - 0.40) * 4.5, 2.0)) * 0.15;
          float surf5  = fbm(uv * 3.8 + q5 * 0.7 + vec2(uTime * 0.007)) * 0.12;
          density = (shell5 + core5 + halo5 + surf5 * (shell5 + halo5)) * 0.68;

        } else if (uNebulaPath == 6) {
          // PATH 6 — Turbulent Cascade: Kolmogorov energy cascade
          // Three warped FBM layers at frequency ratios 1:2:4, each smaller
          // scale emerging only inside the larger scale structure.
          vec2 q6;
          q6.x = fbm(uv + vec2(0.0, uTime * 0.016));
          q6.y = fbm(uv + vec2(5.2, uTime * 0.012));
          qLen = length(q6);
          float large6  = fbm(uv * 1.0 + uWarp * q6 * 0.9);
          float medium6 = fbm(uv * 2.1 + uWarp * q6 * 0.55 + vec2(3.7, 1.2)) * 0.42;
          float fine6   = fbm(uv * 4.4 + uWarp * q6 * 0.35 + vec2(7.1, 5.8)) * 0.20;
          density = (large6 + medium6 * smoothstep(0.15, 0.45, large6) + fine6 * smoothstep(0.30, 0.60, large6)) * 0.72;

        } else {
          // PATH 7 — Bow Shock Arcs: compressed gas sheets from stellar wind
          // A slow asymmetric wind direction warps the density field into
          // two bright compressed arcs — upwind (bright) and trailing (faint).
          vec2 q7;
          q7.x = fbm(uv + vec2(0.0, uTime * 0.013));
          q7.y = fbm(uv + vec2(4.8, uTime * 0.009));
          qLen = length(q7);
          float base7 = fbm(uv + uWarp * q7 * 0.8);
          float windAngle = uTime * 0.012;
          vec2 windDir7 = vec2(cos(windAngle) * 0.6 + 0.3, sin(windAngle) * 0.4 + 0.2);
          float windDot7 = dot(uv + q7 * 0.18, normalize(windDir7));
          float arc7a = exp(-pow(windDot7 * 3.2 + 0.35, 2.0)) * 0.35;
          float arc7b = exp(-pow(windDot7 * 2.0 - 0.55, 2.0)) * 0.18;
          density = (base7 * 0.5 + (arc7a + arc7b) * smoothstep(0.08, 0.45, base7 + 0.25)) * 0.65;
        }

      } else if (uPerfTier < 0.8) {
        // MED — Single domain warp (smooth organic gas flow)
        vec2 q;
        q.x = fbm(uv + vec2(0.0, uTime * 0.018));
        q.y = fbm(uv + vec2(5.2, uTime * 0.013));
        density = fbm(uv + uWarp * q);
      } else {
        // LOW — Direct fbm (flat performance mode)
        density = fbm(uv + vec2(uTime * 0.015));
      }
      float gasDensity = smoothstep(0.0, 0.5, density);

      // 4. Dark dust absorption lanes
      vec2 dustUv = centeredUv * uScale * 0.72 + uParallaxOffset + vec2(17.3, 8.1);
      float dustField = dustFbm(dustUv + vec2(uTime * 0.008, -uTime * 0.006));
      // HIGH tier gets slightly crispier dust lanes for extra 3D depth
      float dustExponent = uPerfTier < 0.3 ? 2.8 : 2.5;
      float absorption = pow(dustField, dustExponent) * uDustStrength;
      float gasAfterDust = max(0.0, gasDensity - absorption * gasDensity);

      // 5. Pillar structures
      vec2 pillarUv = centeredUv * 3.0;
      float p1 = pillar(pillarUv + vec2(0.3, -0.2), normalize(vec2(0.3, 1.0)), 0.14, 1.0);
      float p2 = pillar(pillarUv + vec2(-0.4, 0.1), normalize(vec2(-0.2, 1.0)), 0.11, 0.85);
      float pillars = (p1 + p2 * 0.75) * uPillarStrength;
      float finalDensity = clamp(gasAfterDust + pillars * organicMask, 0.0, 1.0);

      // 6. Hubble SHO color science
      float coreGlow = smoothstep(uCoreRadius, 0.0, edgeDist);

      vec3 col = uColorOIII;
      col = mix(col, uColorHa,   smoothstep(0.1, 0.6,  finalDensity));
      col = mix(col, uColorSII,  smoothstep(0.5, 0.85, finalDensity));
      col = mix(col, uColorCore, smoothstep(0.75, 1.0, finalDensity) + coreGlow * 0.5);
      // Volumetric light scatter active on HIGH tier when qLen is calculated
      if (uPerfTier < 0.3) {
        col += uColorOIII * pow(max(0.0, qLen - 0.28), 2.0) * 0.4;
      }

      // 7. Volumetric scatter halo (soft inner glow)
      float glow = volumetricGlow(centeredUv, finalDensity, uGlowRadius);
      col += uColorOIII * glow * 0.6 + uColorHa * glow * 0.4;

      col *= uBrightness;

      // 8. Embedded young star field
      //    Stars appear bright-white with blue tint (T-Tauri / O-type newborns)
      float stars = starField(vUv, uStarCount, uTime);
      // Stars only show where there IS gas (inside nebula) and are brightest on dust pillars
      float starMask = organicMask * planeEdgeFade;
      vec3 starColor = mix(vec3(0.9, 0.95, 1.0), vec3(1.0, 0.9, 0.7),
                           hash1(floor(vUv * uStarCount))); // warm/cool mix per star
      col = mix(col, col + starColor * 1.8, stars * starMask);

      // 9. Final alpha
      float alpha = clamp(finalDensity * organicMask * planeEdgeFade * uAlpha, 0.0, 1.0);
      // Stars need their own alpha boost so they punch through
      alpha = clamp(alpha + stars * starMask * 0.95, 0.0, 1.0);

      gl_FragColor = vec4(col, alpha);
    }
  `
);

extend({ NebulaMaterial });
