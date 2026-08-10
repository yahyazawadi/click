import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

export const NebulaMaterial = shaderMaterial(
  {
    uTime: 0,
    uColor1: new THREE.Color('#000000'), // Transparent Space Base
    uColor2: new THREE.Color('#c40045'), // Vibrant Crimson Gas Cloud Mass
    uColor3: new THREE.Color('#9900ff'), // Violet / Magenta Emission Glow
    uScale: 3.5,
    uWarp: 2.5,
    uMaskRadius: 0.38,
    uEdgeWarp: 0.25,
    uParallaxOffset: new THREE.Vector2(0, 0),
    uAlpha: 1.0,
    uBrightness: 2.2,
  },
  // Vertex Shader
  /* glsl */ `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment Shader - Zero Rectangular Edges, Pure Organic Fractal Gas Alpha
  /* glsl */ `
    uniform float uTime;
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    uniform vec3 uColor3;
    uniform float uScale;
    uniform float uWarp;
    uniform float uMaskRadius;
    uniform float uEdgeWarp;
    uniform vec2 uParallaxOffset;
    uniform float uAlpha;
    uniform float uBrightness;

    varying vec2 vUv;

    vec2 hash(vec2 p) {
      p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
      return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);

      return mix(
        mix(dot(hash(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
            dot(hash(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
        mix(dot(hash(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
            dot(hash(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
        u.y
      );
    }

    float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
      for (int i = 0; i < 5; i++) {
        v += a * noise(p);
        p = rot * p * 2.05 + vec2(11.5, 34.7);
        a *= 0.5;
      }
      return v;
    }

    void main() {
      vec2 centeredUv = vUv - vec2(0.5);

      // 1. Mandatory Plane Edge Fade (Forces alpha to 0.0 at UV 0.44, well before physical mesh boundary at 0.50)
      float edgeDist = length(centeredUv);
      float planeEdgeFade = smoothstep(0.45, 0.15, edgeDist);

      // 2. Organic noise edge displacement mask
      float angle = atan(centeredUv.y, centeredUv.x);
      float edgeNoise = fbm(vec2(angle * 2.5, uTime * 0.015) + centeredUv * 2.0) * uEdgeWarp;
      float organicMask = smoothstep(uMaskRadius, uMaskRadius * 0.15, edgeDist + edgeNoise);

      // 3. Domain Warped Gas Turbulence
      vec2 uv = centeredUv * uScale + uParallaxOffset;
      vec2 q = vec2(0.0);
      q.x = fbm(uv + vec2(0.0, uTime * 0.02));
      q.y = fbm(uv + vec2(5.2, uTime * 0.015));

      vec2 r = vec2(0.0);
      r.x = fbm(uv + uWarp * q + vec2(1.7, uTime * 0.012));
      r.y = fbm(uv + uWarp * q + vec2(8.3, uTime * 0.018));

      float density = fbm(uv + uWarp * r);

      // 4. Gas Density Threshold: Gas exists ONLY where turbulence is positive. Gaps are 100% clear space!
      float gasDensity = smoothstep(0.0, 0.5, density);

      // 5. Gas Emission Color
      vec3 col = mix(uColor2, uColor3, smoothstep(0.0, 0.7, length(q)));
      col += uColor3 * pow(gasDensity, 2.0) * 1.2;
      col *= uBrightness;

      // 6. Total Organic Alpha (Zero square edges can ever render!)
      float alpha = clamp(gasDensity * organicMask * planeEdgeFade * uAlpha, 0.0, 1.0);

      gl_FragColor = vec4(col, alpha);
    }
  `
);

extend({ NebulaMaterial });
