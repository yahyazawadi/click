import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

export const ApifyPlanetShaderMaterial = shaderMaterial(
  {
    uTime:          0,
    uPerfTier:      0.0,
    uApifyBlue:     new THREE.Color('#246DFF'),
    uApifyBlueDeep: new THREE.Color('#0A4CD2'),
    uApifyGreen:    new THREE.Color('#20A34E'),
    uApifyGreenLit: new THREE.Color('#2EE26D'),
    uApifyOrange:   new THREE.Color('#F86606'),
    uApifyAmber:    new THREE.Color('#FFA347'),
    uCrispWhite:    new THREE.Color('#FFFFFF'),
    uAtmosphere:    new THREE.Color('#246DFF'),
  },

  // ── Vertex Shader ──────────────────────────────────────────────────────────
  /* glsl */ `
    varying vec2 vUv;
    varying vec3 vWorldNormal;
    varying vec3 vWorldPosition;
    varying vec3 vPosition;

    void main() {
      vUv             = uv;
      vPosition       = position;
      vec4 worldPos   = modelMatrix * vec4(position, 1.0);
      vWorldPosition  = worldPos.xyz;
      vWorldNormal    = normalize(mat3(modelMatrix) * normal);
      gl_Position     = projectionMatrix * viewMatrix * worldPos;
    }
  `,

  // ── Fragment Shader ─────────────────────────────────────────────────────────
  /* glsl */ `
    uniform float uTime;
    uniform float uPerfTier;
    uniform vec3  uApifyBlue;
    uniform vec3  uApifyBlueDeep;
    uniform vec3  uApifyGreen;
    uniform vec3  uApifyGreenLit;
    uniform vec3  uApifyOrange;
    uniform vec3  uApifyAmber;
    uniform vec3  uCrispWhite;
    uniform vec3  uAtmosphere;

    varying vec2 vUv;
    varying vec3 vWorldNormal;
    varying vec3 vWorldPosition;
    varying vec3 vPosition;

    vec3 hash3(vec3 p) {
      p = vec3(dot(p, vec3(127.1, 311.7,  74.7)),
               dot(p, vec3(269.5, 183.3, 246.1)),
               dot(p, vec3(113.5, 271.9, 124.6)));
      return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
    }

    float noise(vec3 p) {
      vec3 i = floor(p), f = fract(p);
      vec3 u = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(mix(dot(hash3(i+vec3(0,0,0)), f-vec3(0,0,0)),
                dot(hash3(i+vec3(1,0,0)), f-vec3(1,0,0)), u.x),
            mix(dot(hash3(i+vec3(0,1,0)), f-vec3(0,1,0)),
                dot(hash3(i+vec3(1,1,0)), f-vec3(1,1,0)), u.x), u.y),
        mix(mix(dot(hash3(i+vec3(0,0,1)), f-vec3(0,0,1)),
                dot(hash3(i+vec3(1,0,1)), f-vec3(1,0,1)), u.x),
            mix(dot(hash3(i+vec3(0,1,1)), f-vec3(0,1,1)),
                dot(hash3(i+vec3(1,1,1)), f-vec3(1,1,1)), u.x), u.y),
        u.z);
    }

    float fbm(vec3 p) {
      float v = 0.0;
      float a = 0.5;
      for (int i = 0; i < 4; i++) {
        v += a * noise(p);
        p = p * 2.05 + vec3(1.2, 3.4, 0.7);
        a *= 0.5;
      }
      return v;
    }

    void main() {
      vec3 norm = normalize(vPosition);
      float t = uTime * 0.06;

      // ── Base: Very dark charcoal-navy — the core Apify "dark mode" brand ──────
      // #1A1E2E deep slate, slightly tinted blue
      vec3 darkBase  = vec3(0.09, 0.11, 0.18);
      vec3 midBlue   = vec3(0.11, 0.18, 0.38); // midnight blue highlight zones

      // Large-scale surface variation: two-tone dark, barely perceptible topology
      vec3  p1   = norm * 2.2 + vec3(t * 0.3, t * 0.1, 0.0);
      float topo = fbm(p1) * 0.5 + 0.5;            // 0..1
      vec3  baseSurface = mix(darkBase, midBlue, smoothstep(0.35, 0.72, topo));

      // ── Circuit-board teal veins — Apify blue at low intensity ───────────────
      // Fine, grid-like lines that pulse very subtly — data-stream feel
      vec3  p2    = norm * 6.8 - vec3(t * 0.55, t * 0.25, 0.0);
      float vein  = smoothstep(0.60, 0.68, abs(fbm(p2)));  // narrow bright lines
      float vein2 = smoothstep(0.58, 0.65, abs(noise(norm * 9.5 + vec3(0.0, t * 0.4, t * 0.2))));
      float veins = clamp(vein * 0.6 + vein2 * 0.4, 0.0, 1.0);

      // Teal-leaning version of Apify blue (desaturated, refined)
      vec3 veinColor = vec3(0.12, 0.38, 0.82); // #1E60D0 — calm, not screaming
      baseSurface = mix(baseSurface, veinColor, veins * 0.55);

      // ── Hairline orange fault lines — extremely subtle, just alive ────────────
      vec3  p3      = norm * 11.0 + vec3(t * 0.9, 0.0, t * 0.5);
      float fault   = smoothstep(0.70, 0.74, abs(noise(p3)));
      baseSurface   = mix(baseSurface, uApifyOrange * 0.45, fault * 0.18);

      // ── Lighting: moody directional — high contrast but not blown out ─────────
      vec3  lightDir = normalize(vec3(18.0, 12.0, 22.0) - vWorldPosition);
      float diff     = max(0.0, dot(vWorldNormal, lightDir));
      // Weighted: 0.45 ambient keeps it dark, 0.65 directional gives drama
      baseSurface *= (0.45 + diff * 0.65);

      // ── Specular — tight, cool-white glint on the facing hemisphere ───────────
      vec3  viewDir = normalize(cameraPosition - vWorldPosition);
      vec3  halfDir = normalize(lightDir + viewDir);
      float spec    = pow(max(0.0, dot(vWorldNormal, halfDir)), 64.0);
      baseSurface  += vec3(0.55, 0.72, 1.0) * spec * 0.55; // cool blue-white specular

      // ── Fresnel limb glow — single-tone blue, whisper of orange at equator ────
      float fresnel   = pow(1.0 - max(dot(vWorldNormal, viewDir), 0.0), 3.2);
      float equator   = 1.0 - abs(norm.y);            // bright at equator
      vec3  limbColor = mix(
        vec3(0.14, 0.38, 0.95),   // rich blue at poles
        vec3(0.97, 0.40, 0.02),   // very restrained orange at equator
        smoothstep(0.0, 1.0, equator * 0.35)
      );
      baseSurface += limbColor * fresnel * 0.55;

      gl_FragColor = vec4(baseSurface, 1.0);
    }
  `
);

extend({ ApifyPlanetShaderMaterial });
