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
  // Vertex Shader
  /* glsl */ `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment Shader — Procedural Sci-Fi Planetary Surface with Continent Swirls & Atmosphere Glow
  /* glsl */ `
    uniform float uTime;
    uniform vec3 uBaseColor;
    uniform vec3 uSecondaryColor;
    uniform vec3 uAccentColor;
    uniform vec3 uGlowColor;
    uniform vec3 uAtmosphereColor;

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;

    // 3D Simplex-like noise helper
    vec4 permute(vec4 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

    float snoise(vec3 v) {
      const vec2 C = vec2(1.0/6.0, 1.0/3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

      // First corner
      vec3 i  = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);

      // Other corners
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);

      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;

      // Permutations
      i = mod(i, 289.0);
      vec4 p = permute(permute(permute(
                i.z + vec4(0.0, i1.z, i2.z, 1.0))
              + i.y + vec4(0.0, i1.y, i2.y, 1.0))
              + i.x + vec4(0.0, i1.x, i2.x, 1.0));

      // Gradients
      float n_ = 0.142857142857; // 1.0/7.0
      vec3 ns = n_ * D.wyz - D.xzx;

      vec4 j = p - 49.0 * floor(p * ns.z); // mod(p,7*7)

      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_); // mod(j,N)

      vec4 x = x_ *ns.x + ns.yyyy;
      vec4 y = y_ *ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);

      vec4 b0 = vec4(x.xy, y.xy);
      vec4 b1 = vec4(x.zw, y.zw);

      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));

      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

      vec3 p0 = vec3(a0.xy, h.x);
      vec3 p1 = vec3(a0.zw, h.y);
      vec3 p2 = vec3(a1.xy, h.z);
      vec3 p3 = vec3(a1.zw, h.w);

      // Normalise gradients
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;

      // Mix final noise value
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
    }

    // 3D Fractal Brownian Motion for rich surface details
    float fbm3D(vec3 p) {
      float value = 0.0;
      float amplitude = 0.5;
      for (int i = 0; i < 5; i++) {
        value += amplitude * snoise(p);
        p *= 2.02;
        amplitude *= 0.5;
      }
      return value;
    }

    void main() {
      vec3 pos = vPosition * 1.5;
      
      // 1. Slow planetary rotation swirl
      float time = uTime * 0.08;
      vec3 animPos = vec3(pos.x * cos(time) - pos.z * sin(time), pos.y, pos.x * sin(time) + pos.z * cos(time));

      // 2. Domain-warped surface landmasses & tectonic textures
      float n1 = fbm3D(animPos);
      float n2 = fbm3D(animPos + vec3(n1 * 1.8, 2.5, n1 * 1.2));
      float continentShape = fbm3D(animPos * 1.2 + vec3(n2 * 2.0));

      // 3. Color layering based on terrain elevation
      vec3 finalColor = uBaseColor;
      
      // Deep ocean / shadow trench
      finalColor = mix(finalColor, uSecondaryColor, smoothstep(-0.4, 0.1, continentShape));

      // Tectonic ridges & plateaus
      finalColor = mix(finalColor, uGlowColor * 0.8, smoothstep(0.1, 0.4, continentShape));

      // Bioluminescent energy veins running through the planet
      float veinPattern = smoothstep(0.02, 0.08, abs(snoise(animPos * 4.0 + n2 * 1.5)));
      float veinGlow = (1.0 - veinPattern) * smoothstep(0.0, 0.5, continentShape);
      finalColor += uAccentColor * veinGlow * 1.5;

      // 4. Fresnel Rim Lighting (Cosmic Atmospheric Glow)
      vec3 viewDir = normalize(-vPosition); // In object space approximation
      float fresnel = pow(1.0 - max(0.0, dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.5);
      finalColor += uAtmosphereColor * fresnel * 1.4;

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
);

extend({ PlanetCoreMaterial });
