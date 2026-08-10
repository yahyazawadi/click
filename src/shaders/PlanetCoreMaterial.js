import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

export const PlanetCoreMaterial = shaderMaterial(
  {
    uTime: 0,
    uDeepOcean:      new THREE.Color('#041830'),  // Deep space blue
    uMidOcean:       new THREE.Color('#0a4070'),  // Visible ocean mid-tone
    uCloudBand:      new THREE.Color('#1a7aaa'),  // Cloud belt teal-blue
    uStormHighlight: new THREE.Color('#00d4f0'),  // Bright storm cyan
    uAtmosphere:     new THREE.Color('#00BAE3'),  // Limb atmosphere glow
    uContinentColor: new THREE.Color('#2d5a6e'),  // Lighter teal landmass
    uCoastColor:     new THREE.Color('#1a8090'),  // Shallow coastal shelf
  },
  // Vertex Shader — calculate World Position and World Normal correctly
  /* glsl */ `
    varying vec2 vUv;
    varying vec3 vWorldNormal;
    varying vec3 vWorldPosition;

    void main() {
      vUv = uv;
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      // Transform normal into world space using modelMatrix
      vWorldNormal = normalize(mat3(modelMatrix) * normal);
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `,
  // Fragment Shader — World-space lighting aligned with Nebula 1 (Top-Left)
  /* glsl */ `
    uniform float uTime;
    uniform vec3 uDeepOcean;
    uniform vec3 uMidOcean;
    uniform vec3 uCloudBand;
    uniform vec3 uStormHighlight;
    uniform vec3 uAtmosphere;
    uniform vec3 uContinentColor;
    uniform vec3 uCoastColor;

    varying vec2 vUv;
    varying vec3 vWorldNormal;
    varying vec3 vWorldPosition;

    // ---- Noise infrastructure ----
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

    // FBM — organic turbulence
    float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
      for (int i = 0; i < 6; i++) {
        v += a * noise(p);
        p = rot * p * 2.03 + vec2(3.1, 7.4);
        a *= 0.5;
      }
      return v;
    }

    void main() {
      // World-space Normal
      vec3 N = normalize(vWorldNormal);

      // ---- 1. Organic atmospheric cloud bands ----
      float drift = uTime * 0.025;
      vec2 uv = vec2(vUv.x + drift, vUv.y);
      vec2 q = vec2(fbm(uv * 2.0), fbm(uv * 2.0 + vec2(5.2, 1.3)));
      vec2 r = vec2(fbm(uv * 2.5 + 1.7 * q + vec2(1.7, 9.2) + drift * 0.5),
                    fbm(uv * 2.5 + 1.7 * q + vec2(8.3, 2.8)));

      float cloudField = fbm(uv * 3.0 + 1.8 * r);

      // ---- 2. Latitudinal band structure ----
      float lat = vUv.y;
      float warpedLat = lat + cloudField * 0.12;
      float bands = sin(warpedLat * 14.0) * 0.4
                  + sin(warpedLat * 28.0 + cloudField * 2.0) * 0.2
                  + sin(warpedLat * 6.0 + r.x * 1.5) * 0.4;
      bands = bands * 0.5 + 0.5;

      // ---- 3. Color blending based on bands + cloud density ----
      vec3 col = uDeepOcean;
      col = mix(col, uMidOcean, smoothstep(0.2, 0.65, bands));
      col = mix(col, uCloudBand, smoothstep(0.55, 0.75, bands));

      float stormIntensity = length(r) * 0.5;
      float stormMask = smoothstep(0.3, 0.7, stormIntensity) * smoothstep(0.6, 0.85, bands);
      col = mix(col, uStormHighlight, stormMask * 0.7);

      // ---- 3b. Continent landmasses ----
      float continentDrift = uTime * 0.004;
      vec2 cUv = vec2(vUv.x + continentDrift, vUv.y);

      vec2 cq = vec2(fbm(cUv * 0.7 + vec2(31.7, 12.5)),
                     fbm(cUv * 0.7 + vec2(14.3, 47.8)));
      float continentField = fbm(cUv * 0.9 + 0.5 * cq + vec2(8.2, 61.3));

      float seaLevel   = -0.10;
      float landHeight = smoothstep(seaLevel, seaLevel + 0.30, continentField);
      float coastShelf = smoothstep(seaLevel - 0.15, seaLevel + 0.05, continentField)
                       * (1.0 - landHeight);

      col = mix(col, uCoastColor,     coastShelf * 0.85);
      col = mix(col, uContinentColor, landHeight);

      // Polar darkening
      float polarFade = pow(sin(lat * 3.14159), 0.4);
      col *= mix(0.45, 1.0, polarFade);

      // ---- 4. World-Space Physically-Based Lighting ----
      // Nebula 1 position in world space is approx (-35, 20, -40).
      // We set light direction pointing FROM the planet TOWARDS Nebula 1 (Top-Left):
      vec3 nebulaLightPos = vec3(-30.0, 20.0, 15.0);
      vec3 lightDir = normalize(nebulaLightPos - vWorldPosition);

      // Diffuse lighting calculation (World space)
      float diffuse = max(0.0, dot(N, lightDir));
      float ambient = 0.25;
      float light = ambient + diffuse * 0.85;

      col *= light;

      // Specular highlight (World space)
      vec3 viewDir = normalize(cameraPosition - vWorldPosition);
      vec3 halfDir = normalize(lightDir + viewDir);
      float spec = pow(max(0.0, dot(N, halfDir)), 32.0);
      col += uStormHighlight * spec * 0.35;

      // ---- 5. Atmospheric Limb Glow (Fresnel in World Space) ----
      float fresnel = pow(1.0 - max(0.0, dot(N, viewDir)), 3.0);
      col += uAtmosphere * fresnel * 0.8;

      gl_FragColor = vec4(col, 1.0);
    }
  `
);

extend({ PlanetCoreMaterial });
