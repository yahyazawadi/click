import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

export const NebulaMaterial = shaderMaterial(
  {
    uTime: 0,
    uColor1: new THREE.Color('#08001a'), // Dark Midnight Indigo
    uColor2: new THREE.Color('#c40045'), // Vibrant Crimson Gas Cloud Mass
    uColor3: new THREE.Color('#a100ff'), // Violet Emission Glow
    uScale: 3.5,
    uWarp: 2.5,
    uParallaxOffset: new THREE.Vector2(0, 0),
    uAlpha: 1.0,
    uBrightness: 2.0,
  },
  // Vertex Shader
  /* glsl */ `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment Shader - High-contrast smooth gas clouds & luminous tendrils
  /* glsl */ `
    uniform float uTime;
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    uniform vec3 uColor3;
    uniform float uScale;
    uniform float uWarp;
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
      // Centered UVs with scale & parallax offset
      vec2 uv = (vUv - vec2(0.5)) * uScale + uParallaxOffset;

      // Soft vignette mask around canvas edges
      float dist = length(vUv - vec2(0.5));
      float vignette = smoothstep(0.9, 0.05, dist);

      // Domain Warping for fluid cosmic gas swirls
      vec2 q = vec2(0.0);
      q.x = fbm(uv + vec2(0.0, uTime * 0.02));
      q.y = fbm(uv + vec2(5.2, uTime * 0.015));

      vec2 r = vec2(0.0);
      r.x = fbm(uv + uWarp * q + vec2(1.7, uTime * 0.012));
      r.y = fbm(uv + uWarp * q + vec2(8.3, uTime * 0.018));

      float density = fbm(uv + uWarp * r);

      // Sharpen cloud contrast for defined gas structures & wisps
      float cloudVal = smoothstep(-0.25, 0.35, density);

      // Color composition
      vec3 col = mix(uColor1, uColor2, smoothstep(-0.3, 0.4, length(q)));
      col = mix(col, uColor3, smoothstep(0.0, 0.5, r.x * r.x * 2.5));

      // Luminous gas core emission
      float glow = pow(cloudVal, 1.8);
      col += uColor3 * glow * 1.2;

      col *= uBrightness;
      float alpha = clamp(cloudVal * vignette * uAlpha, 0.0, 1.0);

      gl_FragColor = vec4(col, alpha);
    }
  `
);

extend({ NebulaMaterial });
