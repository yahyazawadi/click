import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

export const NebulaMaterial = shaderMaterial(
  {
    uTime: 0,
    // Hubble SHO palette: Sulfur-II → H-alpha → OIII
    uColorSII:  new THREE.Color('#ff4500'), // Sulfur-II  — warm orange-red (SII emission 673nm)
    uColorHa:   new THREE.Color('#c0001a'), // H-alpha    — deep crimson  (Ha  emission 656nm)
    uColorOIII: new THREE.Color('#00b4c8'), // OIII       — ionized teal  (OIII emission 501nm)
    uColorCore: new THREE.Color('#00e5ff'), // Hot core   — electric cyan (portfolio orbit color)
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
  /* glsl */ `
    uniform float uTime;
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

    // 8-octave gas FBM
    float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      mat2 rot = mat2(0.80, 0.60, -0.60, 0.80);
      for (int i = 0; i < 8; i++) {
        v += a * noise(p);
        p  = rot * p * 2.07 + vec2(13.4, 27.9);
        a *= 0.48;
      }
      return v;
    }

    // 6-octave dust FBM
    float dustFbm(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      mat2 rot = mat2(0.62, 0.78, -0.78, 0.62);
      for (int i = 0; i < 6; i++) {
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
    // Uses a grid-based approach: each cell can contain 0-1 stars
    float starField(vec2 uv, float count, float time) {
      float result = 0.0;
      vec2 cell = floor(uv * count);
      // Check this cell and neighbors for star
      for (int dx = -1; dx <= 1; dx++) {
        for (int dy = -1; dy <= 1; dy++) {
          vec2 neighborCell = cell + vec2(float(dx), float(dy));
          // Pseudo-random star position within cell
          vec2 starPos = (neighborCell + 0.5 + 0.45 * hash2(neighborCell + vec2(13.7, 29.3))) / count;
          float starDist = length(uv / count - starPos);
          // Only ~30% of cells contain a star (hash threshold)
          float presence = step(0.7, hash1(neighborCell + vec2(7.3, 41.9)));
          // Twinkle animation
          float twinkle = 0.8 + 0.2 * sin(time * 3.0 + hash1(neighborCell) * 6.28318);
          // Star brightness — tiny sharp disk + soft diffraction spike halo
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
      vec2 uv = centeredUv * uScale + uParallaxOffset;
      vec2 q;
      q.x = fbm(uv + vec2(0.0,  uTime * 0.018));
      q.y = fbm(uv + vec2(5.2,  uTime * 0.013));
      vec2 r;
      r.x = fbm(uv + uWarp * q + vec2(1.7, uTime * 0.010));
      r.y = fbm(uv + uWarp * q + vec2(8.3, uTime * 0.016));
      float density = fbm(uv + uWarp * r);
      float gasDensity = smoothstep(0.0, 0.5, density);

      // 4. Dust absorption lanes — absorbed regions emit deep indigo, NOT grey
      vec2 dustUv = centeredUv * uScale * 0.72 + uParallaxOffset + vec2(17.3, 8.1);
      float dustField = dustFbm(dustUv + vec2(uTime * 0.008, -uTime * 0.006));
      float absorption = pow(dustField, 2.5) * uDustStrength;
      // Reduce absorption strength — lanes are thinner and more atmospheric
      float gasAfterDust = max(0.0, gasDensity - absorption * gasDensity * 0.75);
      // dustAbsorption amount (0=clear gas, 1=fully absorbed lane)
      float dustLaneMask = clamp(absorption * gasDensity * 1.6, 0.0, 1.0);

      // 5. Pillar structures
      vec2 pillarUv = centeredUv * 3.0;
      float p1 = pillar(pillarUv + vec2(0.3, -0.2), normalize(vec2(0.3, 1.0)), 0.14, 1.0);
      float p2 = pillar(pillarUv + vec2(-0.4, 0.1), normalize(vec2(-0.2, 1.0)), 0.11, 0.85);
      float pillars = (p1 + p2 * 0.75) * uPillarStrength;
      float finalDensity = clamp(gasAfterDust + pillars * organicMask, 0.0, 1.0);

      // 6. Color science — portfolio palette
      float coreGlow = smoothstep(uCoreRadius, 0.0, edgeDist);
      float qLen     = length(q);

      // Saturated violet floor: dust lanes glow deep violet, never grey
      // uColorOIII tinted heavily so even darkest absorbed regions stay vivid
      vec3 dustLaneColor = uColorOIII * 0.25 + uColorHa * 0.12;

      vec3 col = uColorOIII;
      col = mix(col, uColorHa,   smoothstep(0.1, 0.6,  finalDensity));
      col = mix(col, uColorSII,  smoothstep(0.5, 0.85, finalDensity));
      col = mix(col, uColorCore, smoothstep(0.75, 1.0, finalDensity) + coreGlow * 0.5);
      col += uColorOIII * pow(max(0.0, qLen - 0.3), 2.0) * 0.35;

      // Blend in indigo dust lane color so absorbed areas are rich, not grey
      col = mix(col, dustLaneColor, dustLaneMask * 0.7);

      // 7. Volumetric scatter halo (soft inner glow)
      float glow = volumetricGlow(centeredUv, finalDensity, uGlowRadius);
      col += uColorOIII * glow * 0.6 + uColorHa * glow * 0.4;

      col *= uBrightness;

      // 8. Embedded young star field
      //    Stars appear bright-white with blue tint (T-Tauri / O-type newborns)
      float stars = starField(vUv, uStarCount, uTime);
      // Stars: electric cyan <-> hot violet — zero grey, fully on-palette
      float starMask = organicMask * planeEdgeFade;
      float starHue = hash1(floor(vUv * uStarCount));
      vec3 starColor = mix(vec3(0.0, 0.88, 1.0),   // electric cyan  #00e0ff
                           vec3(0.72, 0.0,  1.0),   // hot violet     #b800ff
                           starHue);
      col = mix(col, col + starColor * 2.0, stars * starMask);

      // 9. Final alpha
      float alpha = clamp(finalDensity * organicMask * planeEdgeFade * uAlpha, 0.0, 1.0);
      // Stars need their own alpha boost so they punch through
      alpha = clamp(alpha + stars * starMask * 0.95, 0.0, 1.0);

      gl_FragColor = vec4(col, alpha);
    }
  `
);

extend({ NebulaMaterial });
