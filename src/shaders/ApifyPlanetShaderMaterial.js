import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

export const ApifyPlanetShaderMaterial = shaderMaterial(
  {
    uTime:          0,
    uPerfTier:      0.0,
    uApifyBlue:     new THREE.Color('#246DFF'), // Official Apify Electric Royal Blue
    uApifyBlueDeep: new THREE.Color('#0A4CD2'), // Deep Oceanic Blue
    uApifyGreen:    new THREE.Color('#20A34E'), // Official Apify Vivid Emerald Green
    uApifyGreenLit: new THREE.Color('#2EE26D'), // Bright Emerald Highland
    uApifyOrange:   new THREE.Color('#F86606'), // Official Apify Solar Orange
    uApifyAmber:    new THREE.Color('#FFA347'), // Warm Luminous Amber
    uCrispWhite:    new THREE.Color('#FFFFFF'), // Pure Crisp Data Highlight
    uAtmosphere:    new THREE.Color('#246DFF'), // Outer Limb Glow
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

    // ── 3D Simplex Value Noise ───────────────────────────────────────────────
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
      float lat = norm.y; // -1 to +1

      float t = uTime * 0.08;

      // ── Layer 1: Continental FBM Warping (Apify Blue vs Apify Green) ─────────
      vec3 p1 = norm * 2.6 + vec3(t * 0.5, t * 0.2, 0.0);
      float cont = fbm(p1);

      // Sharp, vibrant continents (Green) over rich oceanic basins (Blue)
      float landMask = smoothstep(-0.04, 0.14, cont);
      vec3 oceanCol = mix(uApifyBlueDeep, uApifyBlue, smoothstep(-0.4, 0.1, cont));
      vec3 landCol  = mix(uApifyGreen, uApifyGreenLit, smoothstep(0.12, 0.45, cont));

      vec3 baseSurface = mix(oceanCol, landCol, landMask);

      // ── Layer 2: Solar Orange Energy Belts & Geodesic Veins ──────────────────
      // Dynamic scraper data streams traversing the equator & continental faults
      vec3 p2 = norm * 3.8 - vec3(t * 0.7, t * 0.4, 0.0);
      float orangeStream = smoothstep(0.24, 0.40, abs(fbm(p2)));
      float orangeSwirl  = smoothstep(0.18, 0.32, noise(norm * 5.2 + vec3(0.0, t * 0.6, t * 0.3)));
      float orangeTotal  = clamp(orangeStream * 0.7 + orangeSwirl * 0.5, 0.0, 1.0);

      // Blend Solar Orange into planetary channels & faultlines
      baseSurface = mix(baseSurface, uApifyOrange, orangeTotal * 0.75);
      baseSurface += uApifyAmber * orangeSwirl * 0.35;

      // ── Layer 3: Crisp Polar Data Caps (North & South Poles) ─────────────────
      float poleDist = abs(lat);
      float polarCap = smoothstep(0.78, 0.92, poleDist + noise(norm * 4.0) * 0.08);
      baseSurface = mix(baseSurface, uCrispWhite, polarCap * 0.85);

      // ── Layer 4: Cirrus Data Streams (Pure White Highlights) ─────────────────
      float whitePulse = smoothstep(0.38, 0.55, fbm(norm * 4.6 + vec3(t * 0.9, 0.0, t * 0.5)));
      baseSurface += uCrispWhite * whitePulse * 0.4;

      // ── Layer 5: High-Vibrancy Lighting (Guarantees Rich Vibrant Colors) ─────
      // Avoid dark muddy shadows by using strong high-key ambient + directional
      vec3 lightDir = normalize(vec3(20.0, 15.0, 25.0) - vWorldPosition);
      float diff = max(0.0, dot(vWorldNormal, lightDir));
      // 0.60 ambient + 0.55 directional ensures the planet is ALWAYS bright and vivid
      baseSurface *= (0.60 + diff * 0.55);

      // Specular shine on the electric blue oceans
      vec3 viewDir = normalize(cameraPosition - vWorldPosition);
      vec3 halfDir = normalize(lightDir + viewDir);
      float spec   = pow(max(0.0, dot(vWorldNormal, halfDir)), 32.0);
      baseSurface += uApifyAmber * spec * (1.0 - landMask) * 0.65;

      // ── Layer 6: Dual-Tone Radiant Fresnel Limb Glow ─────────────────────────
      float fresnel = pow(1.0 - max(dot(vWorldNormal, viewDir), 0.0), 2.2);
      vec3 limbGlow = mix(uApifyBlue, uApifyOrange, clamp(norm.y * 0.5 + 0.5, 0.0, 1.0));
      baseSurface += limbGlow * fresnel * 0.85;

      gl_FragColor = vec4(baseSurface, 1.0);
    }
  `
);

extend({ ApifyPlanetShaderMaterial });
