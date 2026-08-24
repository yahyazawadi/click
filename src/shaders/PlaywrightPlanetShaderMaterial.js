import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

export const PlaywrightPlanetShaderMaterial = shaderMaterial(
  {
    uTime:         0,
    uPerfTier:     0.0,
    uDeepVoid:     new THREE.Color('#0d0510'), // Deep Velvet Obsidian Void
    uReddishPink:  new THREE.Color('#ff2d6e'), // Radiant Reddish-Pink / Raspberry Coral
    uPinkGlow:     new THREE.Color('#ff6088'), // Luminous Rose Pink Highlight
    uEmeraldGreen: new THREE.Color('#2ead33'), // Vibrant Emerald Green
    uMintGlow:     new THREE.Color('#00f59b'), // Electric Mint Green Highlight
    uAtmosphere:   new THREE.Color('#ff3b75'), // Dual-Tone Horizon Rim
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
    uniform vec3  uDeepVoid;
    uniform vec3  uReddishPink;
    uniform vec3  uPinkGlow;
    uniform vec3  uEmeraldGreen;
    uniform vec3  uMintGlow;
    uniform vec3  uAtmosphere;

    varying vec2 vUv;
    varying vec3 vWorldNormal;
    varying vec3 vWorldPosition;
    varying vec3 vPosition;

    // ── 3D Simplex-Style Value Noise ─────────────────────────────────────────
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

    void main() {
      vec3 norm = normalize(vPosition);

      // Organic dual-tone hemisphere split (Left = Reddish-Pink, Right = Emerald Green)
      float t = uTime * 0.15;
      float n1 = noise(norm * 2.8 + vec3(t, t * 0.7, 0.0)) * 0.25;
      float n2 = noise(norm * 5.6 - vec3(t * 0.5, t, 0.0)) * 0.12;

      // Base blend across X-axis (-1 to +1 normalized to 0 to 1) with smooth organic noise warp
      float blend = clamp((norm.x + n1 + n2) * 0.65 + 0.5, 0.0, 1.0);

      // Smooth color transitions
      vec3 leftColor  = mix(uDeepVoid * 1.5, uReddishPink, smoothstep(-0.2, 0.6, -norm.x + n1));
      vec3 rightColor = mix(uDeepVoid * 1.5, uEmeraldGreen, smoothstep(-0.2, 0.6, norm.x + n1));

      vec3 baseSurface = mix(leftColor, rightColor, blend);

      // Subtle swirling energy rivers & highlights
      float swirlPink  = smoothstep(0.15, 0.35, noise(norm * 4.2 + vec3(t * 0.4, 0.0, t * 0.6))) * (1.0 - blend);
      float swirlGreen = smoothstep(0.15, 0.35, noise(norm * 4.2 - vec3(0.0, t * 0.4, t * 0.6))) * blend;

      baseSurface += uPinkGlow * swirlPink * 0.45;
      baseSurface += uMintGlow * swirlGreen * 0.45;

      // Smooth Fresnel Rim Glow (blends from Pink to Emerald around silhouette)
      vec3 viewDir = normalize(cameraPosition - vWorldPosition);
      float fresnel = pow(1.0 - max(dot(vWorldNormal, viewDir), 0.0), 2.2);

      vec3 rimColor = mix(uReddishPink, uEmeraldGreen, blend);
      vec3 finalColor = baseSurface + rimColor * fresnel * 0.95;

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
);

extend({ PlaywrightPlanetShaderMaterial });
