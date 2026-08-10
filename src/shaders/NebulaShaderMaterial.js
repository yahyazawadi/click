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
    uColorCore: new THREE.Color('#ffe8c0'), // Hot core   — near-white yellow (ionization front)
    uScale: 3.5,
    uWarp: 2.5,
    uMaskRadius: 0.38,
    uEdgeWarp: 0.25,
    uParallaxOffset: new THREE.Vector2(0, 0),
    uAlpha: 1.0,
    uBrightness: 2.2,
    uDustStrength: 0.55,
    uPillarStrength: 0.6,  // elongated density pillar influence
    uCoreRadius: 0.18,     // ionization hot-core region radius
  },
  // Vertex Shader
  /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment Shader — Hubble Emission Palette + Ionization Core + Pillar Columns
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

    varying vec2 vUv;

    // --- Noise ---
    vec2 hash2(vec2 p) {
      p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
      return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
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

    // 6-octave dust FBM (different rotation + seed)
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

    // Pillar column: creates elongated density ridge along a direction
    // baseUv: UV in nebula space; dir: pillar axis direction; thickness controls width
    float pillar(vec2 baseUv, vec2 dir, float thickness, float len) {
      vec2 n = vec2(-dir.y, dir.x); // normal to pillar axis
      float along = dot(baseUv, dir);
      float perp  = dot(baseUv, n);
      float pillShape = smoothstep(thickness, 0.0, abs(perp))
                      * smoothstep(0.0, 0.3, along)
                      * smoothstep(len, len * 0.4, along);
      return pillShape;
    }

    void main() {
      vec2 centeredUv = vUv - vec2(0.5);

      // 1. Radial plane edge fade
      float edgeDist = length(centeredUv);
      float planeEdgeFade = smoothstep(0.45, 0.15, edgeDist);

      // 2. Organic boundary mask
      float angle   = atan(centeredUv.y, centeredUv.x);
      float edgeN   = fbm(vec2(angle * 2.5, uTime * 0.012) + centeredUv * 2.0) * uEdgeWarp;
      float organicMask = smoothstep(uMaskRadius, uMaskRadius * 0.1, edgeDist + edgeN);

      // 3. Domain-warped gas density (two warp levels for turbulence)
      vec2 uv = centeredUv * uScale + uParallaxOffset;
      vec2 q;
      q.x = fbm(uv + vec2(0.0,  uTime * 0.018));
      q.y = fbm(uv + vec2(5.2,  uTime * 0.013));
      vec2 r;
      r.x = fbm(uv + uWarp * q + vec2(1.7, uTime * 0.010));
      r.y = fbm(uv + uWarp * q + vec2(8.3, uTime * 0.016));
      float density = fbm(uv + uWarp * r);
      float gasDensity = smoothstep(0.0, 0.5, density);

      // 4. Dark dust absorption lanes
      vec2 dustUv = centeredUv * uScale * 0.72 + uParallaxOffset + vec2(17.3, 8.1);
      float dustField = dustFbm(dustUv + vec2(uTime * 0.008, -uTime * 0.006));
      float absorption = pow(dustField, 2.5) * uDustStrength;
      float gasAfterDust = max(0.0, gasDensity - absorption * gasDensity);

      // 5. Pillar structures — dense elongated columns at 2 different angles
      //    Pillars exist in nebula UV space and add density on top of gas
      vec2 pillarUv = centeredUv * 3.0;
      float p1 = pillar(pillarUv + vec2(0.3, -0.2), normalize(vec2(0.3, 1.0)), 0.14, 1.0);
      float p2 = pillar(pillarUv + vec2(-0.4, 0.1), normalize(vec2(-0.2, 1.0)), 0.11, 0.85);
      float pillars = (p1 + p2 * 0.75) * uPillarStrength;
      // Pillars add to gas density but cap at 1.0
      float finalDensity = clamp(gasAfterDust + pillars * organicMask, 0.0, 1.0);

      // 6. Hubble SHO color science
      //    - OIII (teal/cyan) outer shell — ionization front at cloud boundary
      //    - H-alpha (deep red) main body
      //    - SII (warm orange) mid-density knots
      //    - Hot core (near-white) at highest density / pillar tip / center
      float coreGlow   = smoothstep(uCoreRadius, 0.0, edgeDist);            // spatial hot core
      float densityT   = finalDensity;
      float qLen       = length(q);

      // Outer ionized shell = OIII (outer boundary of nebula picks this up)
      vec3 col = uColorOIII;
      // Mid-density H-alpha gas body
      col = mix(col, uColorHa,  smoothstep(0.1, 0.6, densityT));
      // High-density Sulfur-II knots
      col = mix(col, uColorSII, smoothstep(0.5, 0.85, densityT));
      // Hot ionization front / pillar tips
      col = mix(col, uColorCore, smoothstep(0.75, 1.0, densityT) + coreGlow * 0.5);

      // Add emission brightness gradient based on turbulence intensity
      col += uColorOIII * pow(max(0.0, qLen - 0.3), 2.0) * 0.35;

      col *= uBrightness;

      // 7. Final alpha
      float alpha = clamp(finalDensity * organicMask * planeEdgeFade * uAlpha, 0.0, 1.0);

      gl_FragColor = vec4(col, alpha);
    }
  `
);

extend({ NebulaMaterial });
