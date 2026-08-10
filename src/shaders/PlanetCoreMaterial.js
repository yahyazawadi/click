import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

export const PlanetCoreMaterial = shaderMaterial(
  {
    uTime: 0,
    uBaseColor: new THREE.Color('#002b5c'),      // Deep abyssal space blue
    uSecondaryColor: new THREE.Color('#006899'), // Deep planetary ocean / trench blue
    uAccentColor: new THREE.Color('#00e5ff'),    // Electric bioluminescent cyan
    uGlowColor: new THREE.Color('#7000ff'),      // Deep cosmic violet energy accent
    uAtmosphereColor: new THREE.Color('#00BAE3'),// Glowing atmospheric rim
  },
  // Vertex Shader — passes world normal and view direction properly
  /* glsl */ `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `,
  // Fragment Shader — Clean Smooth Gas Giant Bands & Bioluminescent Grid Veins
  /* glsl */ `
    uniform float uTime;
    uniform vec3 uBaseColor;
    uniform vec3 uSecondaryColor;
    uniform vec3 uAccentColor;
    uniform vec3 uGlowColor;
    uniform vec3 uAtmosphereColor;

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;

    // Smooth 2D Noise
    vec2 hash2(vec2 p) {
      p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
      return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
    }

    float noise2D(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(dot(hash2(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
            dot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
        mix(dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
            dot(hash2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
        u.y
      );
    }

    float fbm2D(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
      for (int i = 0; i < 4; i++) {
        v += a * noise2D(p);
        p = rot * p * 2.02 + vec2(1.7, 9.2);
        a *= 0.5;
      }
      return v;
    }

    void main() {
      // Normalize normal vector
      vec3 N = normalize(vNormal);

      // 1. Smooth Gas Giant Horizontal Cloud Belts (Jupiter / Neptune style)
      float t = uTime * 0.05;
      vec2 uv = vec2(vUv.x * 2.0 + t, vUv.y * 4.0);
      
      // Gentle atmospheric turbulence
      float warp = fbm2D(uv * 1.5 + vec2(t * 0.2, 0.0));
      float bandPattern = sin((vUv.y + warp * 0.15) * 25.0) * 0.5 + 0.5;

      // 2. Base planet shading using smooth gradient bands
      vec3 finalColor = mix(uBaseColor, uSecondaryColor, bandPattern);
      
      // Soft cosmic violet storm wisps
      float storm = smoothstep(0.2, 0.6, fbm2D(uv * 3.0 + vec2(0.0, t * 0.1)));
      finalColor = mix(finalColor, uGlowColor * 0.7, storm * 0.6);

      // 3. Crisp Sci-Fi Grid Line Overlay (Bioluminescent Quantum Core pattern)
      vec2 gridUv = fract(vUv * 16.0) - 0.5;
      float gridDist = min(abs(gridUv.x), abs(gridUv.y));
      float gridLines = smoothstep(0.03, 0.01, gridDist);
      
      // Pulse energy along grid
      float pulse = sin(vUv.y * 30.0 + uTime * 2.0) * 0.5 + 0.5;
      finalColor += uAccentColor * gridLines * pulse * 0.4;

      // 4. Smooth Specular & Fresnel Rim Lighting
      vec3 viewDir = normalize(cameraPosition - vWorldPosition);
      float fresnel = pow(1.0 - max(0.0, dot(N, viewDir)), 3.0);
      
      // Soft light direction
      vec3 lightDir = normalize(vec3(1.0, 1.0, 2.0));
      float diff = max(0.25, dot(N, lightDir)); // Ambient minimum 0.25
      
      finalColor *= diff;
      finalColor += uAtmosphereColor * fresnel * 1.5;

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
);

extend({ PlanetCoreMaterial });
