import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

// ── 1. Earth Surface Shader Material ─────────────────────────────────────────
export const ClimamedixEarthShaderMaterial = shaderMaterial(
  {
    uTime:       0,
    uPerfTier:   0.0, // 0.0=high, 0.5=med, 1.0=low
    uDeepOcean:  new THREE.Color('#031933'),
    uShallowSea: new THREE.Color('#0c4a6e'),
    uCoast:      new THREE.Color('#0284c7'),
    uLandLow:    new THREE.Color('#1b4332'),
    uLandHigh:   new THREE.Color('#40916c'),
    uMountain:   new THREE.Color('#6b705c'),
    uPolarIce:   new THREE.Color('#f0f9ff'),
    uAtmosphere: new THREE.Color('#38bdf8'),
  },

  // Vertex Shader
  /* glsl */ `
    varying vec2 vUv;
    varying vec3 vWorldNormal;
    varying vec3 vWorldPosition;
    varying vec3 vPosition;

    void main() {
      vUv = uv;
      vPosition = position;
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      vWorldNormal = normalize(mat3(modelMatrix) * normal);
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `,

  // Fragment Shader
  /* glsl */ `
    uniform float uTime;
    uniform float uPerfTier;
    uniform vec3  uDeepOcean;
    uniform vec3  uShallowSea;
    uniform vec3  uCoast;
    uniform vec3  uLandLow;
    uniform vec3  uLandHigh;
    uniform vec3  uMountain;
    uniform vec3  uPolarIce;
    uniform vec3  uAtmosphere;

    varying vec2 vUv;
    varying vec3 vWorldNormal;
    varying vec3 vWorldPosition;
    varying vec3 vPosition;

    // Fast 3D Simplex-Style Hash Noise (Zero texture lookups, minimal ALU)
    vec3 hash3(vec3 p) {
      p = vec3(dot(p, vec3(127.1, 311.7, 74.7)),
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
      vec3 N = normalize(vWorldNormal);
      vec3 p = normalize(vPosition);

      // 1. Multi-scale Continents with Realistic Coastlines
      vec3 landP = p * 1.85 + vec3(12.4, 45.1, 7.8);
      float cont = noise(landP) * 0.62;
      if (uPerfTier < 0.8) {
        cont += noise(landP * 2.8) * 0.28;
        cont += noise(landP * 5.6) * 0.10;
      }

      float seaLevel = 0.02;

      vec3 col = uDeepOcean;
      col = mix(col, uShallowSea, smoothstep(-0.25, seaLevel - 0.02, cont));
      col = mix(col, uCoast,      smoothstep(seaLevel - 0.06, seaLevel + 0.03, cont));

      // Land & Mountains
      float landMask = smoothstep(seaLevel, seaLevel + 0.08, cont);
      vec3 landCol = uLandLow;
      landCol = mix(landCol, uLandHigh, smoothstep(seaLevel + 0.06, seaLevel + 0.22, cont));
      landCol = mix(landCol, uMountain, smoothstep(seaLevel + 0.22, seaLevel + 0.45, cont));
      col = mix(col, landCol, landMask);

      // 2. TWO SYMMETRICAL POLAR ICE CAPS (North Pole AND South Pole)
      // abs(p.y) ensures both poles are identically calculated and accurately proportioned
      float absLat = abs(p.y);
      float polarDist = smoothstep(0.78, 0.94, absLat);
      float iceNoise = noise(p * 9.0) * 0.06;
      float ice = smoothstep(0.20, 0.65, polarDist + iceNoise);
      col = mix(col, uPolarIce, ice);

      // 3. Sun Direct Lighting (PBR Diffuse)
      vec3 lightDir = normalize(vec3(-25.0, 20.0, 20.0) - vWorldPosition);
      float diff = max(0.0, dot(N, lightDir));
      col *= (0.28 + diff * 0.82);

      // 4. Ocean Specular Sun Glint
      vec3 viewDir = normalize(cameraPosition - vWorldPosition);
      vec3 halfDir = normalize(lightDir + viewDir);
      float spec = pow(max(0.0, dot(N, halfDir)), 36.0);
      col += vec3(0.9, 0.95, 1.0) * spec * (1.0 - landMask) * (1.0 - ice) * 0.55;

      // 5. Fresnel Atmospheric Edge Glow
      float fresnel = pow(1.0 - max(0.0, dot(N, viewDir)), 3.0);
      col += uAtmosphere * fresnel * 0.65;

      gl_FragColor = vec4(col, 1.0);
    }
  `
);

// ── 2. Top Clouds Shader Material ────────────────────────────────────────────
export const ClimamedixCloudShaderMaterial = shaderMaterial(
  {
    uTime:       0,
    uPerfTier:   0.0,
    uCloudColor: new THREE.Color('#ffffff'),
  },

  // Vertex Shader
  /* glsl */ `
    varying vec2 vUv;
    varying vec3 vWorldNormal;
    varying vec3 vWorldPosition;
    varying vec3 vPosition;

    void main() {
      vUv = uv;
      vPosition = position;
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      vWorldNormal = normalize(mat3(modelMatrix) * normal);
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `,

  // Fragment Shader
  /* glsl */ `
    uniform float uTime;
    uniform float uPerfTier;
    uniform vec3  uCloudColor;

    varying vec2 vUv;
    varying vec3 vWorldNormal;
    varying vec3 vWorldPosition;
    varying vec3 vPosition;

    vec3 hash3(vec3 p) {
      p = vec3(dot(p, vec3(127.1, 311.7, 74.7)),
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
      vec3 N = normalize(vWorldNormal);
      vec3 p = normalize(vPosition);

      // Swirling multi-octave cloud patterns
      vec3 cP = p * 2.8 + vec3(uTime * 0.02, uTime * 0.01, uTime * 0.015);
      float cn1 = noise(cP);
      float cn2 = (uPerfTier < 0.8) ? noise(cP * 2.6 + vec3(3.2, 1.4, 6.7)) * 0.5 : 0.0;
      float cloudDensity = smoothstep(0.32, 0.70, cn1 + cn2);

      // Cloud directional sun illumination
      vec3 lightDir = normalize(vec3(-25.0, 20.0, 20.0) - vWorldPosition);
      float diff = max(0.0, dot(N, lightDir));
      vec3 col = uCloudColor * (0.4 + diff * 0.7);

      // Soft wispy alpha
      float alpha = cloudDensity * 0.82;

      gl_FragColor = vec4(col, alpha);
    }
  `
);

extend({ ClimamedixEarthShaderMaterial, ClimamedixCloudShaderMaterial });
