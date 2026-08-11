// ─────────────────────────────────────────────────────────────────────────────
//  HIGH-TIER NEBULA RUNTIME PATHS (0–7)
//  Selected dynamically at runtime via the `uNebulaPath` uniform.
//  Each path is 100% isolated within its own GLSL branch in the fragment shader.
//
//  0  SILKY WISPS         — Single domain-warp + micro-filaments
//  1  DEEP OCEAN PILLARS  — Two soft domain-warp passes (LOCKED BASELINE)
//  2  ORION RIBBON        — Rotating bow-shock arc with directional mask
//  3  PLASMA THREADS      — Organic FBM-ridge filaments flowing with gas
//  4  POLAR VORTEX        — Rotating spiral polar coordinates
//  5  EMISSION SHELL      — Hollow ring like the Ring Nebula
//  6  KOLMOGOROV CASCADE  — 3-scale turbulent fluid flow
//  7  BOW SHOCK ARCS      — Compressed gas sheets from stellar wind
// ─────────────────────────────────────────────────────────────────────────────

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

    // Volumetric scatter glow — dual-tier spready halo (inner core + expansive outer aura)
    float volumetricGlow(vec2 centeredUv, float density, float glowRadius) {
      float edgeDist = length(centeredUv);
      float innerGlow = pow(1.0 - smoothstep(0.0, glowRadius, edgeDist), 1.4) * pow(density, 0.5) * 0.45;
      float outerAura = pow(1.0 - smoothstep(0.0, glowRadius * 1.45, edgeDist), 1.8) * pow(density + 0.15, 0.4) * 0.35;
      return innerGlow + outerAura;
    }

    void main() {
      vec2 centeredUv = vUv - vec2(0.5);

      // 1. Radial plane edge kill — smooth gradual falloff
      float edgeDist = length(centeredUv);
      float planeEdgeFade = smoothstep(0.49, 0.08, edgeDist);

      // 2. Organic boundary mask — 2D Cartesian noise (zero polar fan singularities or radial spoke lines)
      float edgeN   = fbm(centeredUv * 3.2 + vec2(uTime * 0.012, -uTime * 0.010)) * uEdgeWarp;
      float organicMask = smoothstep(uMaskRadius * 1.35, uMaskRadius * 0.05, edgeDist + edgeN);

      // 3. Domain-warped gas density
      vec2 uv = centeredUv * uScale + uParallaxOffset;
      float density = 0.0;
      float qLen = 0.0;
      float pathBrightness = 1.0;
      float pathScatter = 0.35;

      int path = uNebulaPath;

      if (path == 0) {
        // PATH 0 — Silky Wisps: single warp + delicate micro-filaments
        vec2 q0;
        q0.x = fbm(uv + vec2(0.0, uTime * 0.018));
        q0.y = fbm(uv + vec2(5.2, uTime * 0.013));
        qLen = length(q0);
        float base0 = fbm(uv + uWarp * q0);
        float filament0 = fbm(uv * 2.4 + q0 * 0.4) * 0.18;
        density = base0 + filament0 * smoothstep(0.1, 0.7, base0);
        pathBrightness = 1.0;
        pathScatter = 0.35;

      } else if (path == 1) {
        // PATH 1 — Deep Ocean Pillars: two soft warp passes (LOCKED BASELINE)
        vec2 q1;
        q1.x = fbm(uv + vec2(0.0,  uTime * 0.014));
        q1.y = fbm(uv + vec2(3.7,  uTime * 0.010));
        qLen = length(q1);
        vec2 r1;
        r1.x = fbm(uv + uWarp * q1 * 0.65 + vec2(2.1, uTime * 0.007));
        r1.y = fbm(uv + uWarp * q1 * 0.65 + vec2(7.4, uTime * 0.009));
        float base1 = fbm(uv + uWarp * q1);
        float deep1 = fbm(uv + uWarp * r1 * 0.5);
        density = mix(base1, deep1, 0.32);
        pathBrightness = 1.0;
        pathScatter = 0.35;

      } else if (path == 2) {
        // PATH 2 — Orion Bow Wave: massive connected cloud with sweeping bow front
        float bowAngle = uTime * 0.006;
        mat2 bowRot = mat2(cos(bowAngle), -sin(bowAngle), sin(bowAngle), cos(bowAngle));
        vec2 q2;
        q2.x = fbm(bowRot * uv + vec2(0.0, uTime * 0.016));
        q2.y = fbm(bowRot * uv + vec2(6.1, uTime * 0.011));
        qLen = length(q2);
        float base2 = fbm(uv + uWarp * q2);
        vec2 rUv = bowRot * uv;
        float bowFront2 = exp(-pow((rUv.y * 0.35 - rUv.x * 0.25), 2.0)) * 0.35;
        density = (base2 * 0.75 + bowFront2 * smoothstep(0.05, 0.45, base2 + 0.20)) * 0.92;
        pathBrightness = 1.0;
        pathScatter = 0.32;

      } else if (path == 3) {
        // PATH 3 — Plasma Canopy: massive connected gas flow with sweeping energy streams
        vec2 q3;
        q3.x = fbm(uv + vec2(0.0, uTime * 0.018));
        q3.y = fbm(uv + vec2(5.2, uTime * 0.013));
        qLen = length(q3);
        float base3 = fbm(uv + uWarp * q3);
        vec2 fUv = uv * 2.2 + q3 * 1.4 + vec2(uTime * 0.0035, uTime * 0.0028);
        float ridgeA = fbm(fUv);
        float threadA = pow(1.0 - abs(ridgeA - 0.48) * 2.2, 3.0) * 0.28;
        density = (base3 * 0.80 + threadA * smoothstep(0.08, 0.55, base3 + 0.15)) * 0.90;
        pathBrightness = 0.96;
        pathScatter = 0.32;

      } else if (path == 4) {
        // PATH 4 — Polar Spiral Galaxy: massive continuous rotating spiral cloud
        float r4 = length(uv);
        float theta4 = atan(uv.y, uv.x) + uTime * 0.022;
        vec2 spiralUv = vec2(r4 * cos(theta4 * 1.4 + r4 * 0.8), r4 * sin(theta4 * 1.4 + r4 * 0.8));
        vec2 q4;
        q4.x = fbm(spiralUv + vec2(0.0, uTime * 0.011));
        q4.y = fbm(spiralUv + vec2(4.1, uTime * 0.008));
        qLen = length(q4);
        float base4 = fbm(spiralUv + uWarp * q4 * 0.75);
        float continuousSpiral = fbm(uv * 1.2 + q4 * 0.5) * 0.35;
        density = (base4 * 0.70 + continuousSpiral) * 0.88;
        pathBrightness = 0.96;
        pathScatter = 0.32;

      } else if (path == 5) {
        // PATH 5 — Cosmic Emission Shroud: broad connected interstellar cloud shroud
        vec2 q5;
        q5.x = fbm(uv + vec2(0.0, uTime * 0.015));
        q5.y = fbm(uv + vec2(6.3, uTime * 0.011));
        qLen = length(q5);
        float base5 = fbm(uv + uWarp * q5 * 0.85);
        float r5 = length(centeredUv + q5 * 0.10);
        float shroud5 = exp(-pow(r5 * 2.8, 2.0)) * 0.35;
        density = (base5 * 0.75 + shroud5 * smoothstep(0.05, 0.45, base5 + 0.15)) * 0.88;
        pathBrightness = 0.95;
        pathScatter = 0.28;

      } else if (path == 6) {
        // PATH 6 — Kolmogorov Fluid Cascade: massive connected turbulent fluid streams
        vec2 q6;
        q6.x = fbm(uv + vec2(0.0, uTime * 0.016));
        q6.y = fbm(uv + vec2(5.2, uTime * 0.012));
        qLen = length(q6);
        float large6  = fbm(uv * 0.85 + uWarp * q6 * 0.85);
        float medium6 = fbm(uv * 1.6 + uWarp * q6 * 0.50 + vec2(3.7, 1.2)) * 0.45;
        density = (large6 * 0.65 + medium6 * smoothstep(0.10, 0.45, large6)) * 0.90;
        pathBrightness = 0.95;
        pathScatter = 0.30;

      } else {
        // PATH 7 — Bow Shock Arcs: compressed gas sheets from stellar wind (GOLD STANDARD FOR TEAL)
        vec2 q7;
        q7.x = fbm(uv + vec2(0.0, uTime * 0.013));
        q7.y = fbm(uv + vec2(4.8, uTime * 0.009));
        qLen = length(q7);
        float base7 = fbm(uv + uWarp * q7 * 0.8);
        float windAngle = uTime * 0.012;
        vec2 windDir7 = vec2(cos(windAngle) * 0.6 + 0.3, sin(windAngle) * 0.4 + 0.2);
        float windDot7 = dot(uv + q7 * 0.18, normalize(windDir7));
        float arc7a = exp(-pow(windDot7 * 3.2 + 0.35, 2.0)) * 0.42;
        float arc7b = exp(-pow(windDot7 * 2.0 - 0.55, 2.0)) * 0.24;
        density = (base7 * 0.55 + (arc7a + arc7b) * smoothstep(0.08, 0.45, base7 + 0.25)) * 0.90;
        pathBrightness = 1.0;
        pathScatter = 0.25;
      }

      float gasDensity = smoothstep(0.0, 0.5, density);

      // 4. Dark dust absorption lanes — soft gas shadows
      vec2 dustUv = centeredUv * uScale * 0.72 + uParallaxOffset + vec2(17.3, 8.1);
      float dustField = dustFbm(dustUv + vec2(uTime * 0.008, -uTime * 0.006));
      float dustExponent = uPerfTier < 0.3 ? 2.8 : 2.5;
      float absorption = pow(dustField, dustExponent) * uDustStrength;
      float gasAfterDust = max(0.0, gasDensity - absorption * gasDensity);

      // 5. Pure smooth gas density (zero hard column lines)
      float finalDensity = clamp(gasAfterDust, 0.0, 1.0);

      // 6. Hubble SHO color science — full strength bright core highlights
      float coreGlow = smoothstep(uCoreRadius, 0.0, edgeDist);

      vec3 col = uColorOIII;
      col = mix(col, uColorHa,   smoothstep(0.1, 0.6,  finalDensity));
      col = mix(col, uColorSII,  smoothstep(0.5, 0.85, finalDensity));
      col = mix(col, uColorCore, smoothstep(0.75, 1.0, finalDensity) + coreGlow * 0.5);
      col += uColorOIII * pow(max(0.0, qLen - 0.3), 2.0) * pathScatter;

      // 7. Volumetric scatter halo (soft inner glow)
      float glow = volumetricGlow(centeredUv, finalDensity, uGlowRadius);
      col += uColorOIII * glow * 0.6 + uColorHa * glow * 0.4;

      col *= (uBrightness * pathBrightness);

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
