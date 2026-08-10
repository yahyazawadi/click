import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

export const PlanetCoreMaterial = shaderMaterial(
  {
    uTime: 0,
    uDeepOcean:      new THREE.Color('#010d1f'),  // Abyssal deep space black-blue
    uMidOcean:       new THREE.Color('#003268'),  // Dark ocean mid-tone
    uCloudBand:      new THREE.Color('#005f8a'),  // Cool cloud belt teal-blue
    uStormHighlight: new THREE.Color('#00b4d8'),  // Bright storm highlight cyan
    uAtmosphere:     new THREE.Color('#00BAE3'),  // Limb atmosphere glow
    uContinentColor: new THREE.Color('#0a2a3a'),  // Dark teal landmass (above sea level)
    uCoastColor:     new THREE.Color('#005577'),  // Shallow coastal shelf highlight
  },
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
    varying vec3 vNormal;
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
      vec3 N = normalize(vNormal);

      // ---- 1. Organic atmospheric cloud bands ----
      // Slow eastward wind drift
      float drift = uTime * 0.025;

      // Domain warp pass 1: coarse turbulence
      vec2 uv = vec2(vUv.x + drift, vUv.y);
      vec2 q = vec2(fbm(uv * 2.0),
                    fbm(uv * 2.0 + vec2(5.2, 1.3)));

      // Domain warp pass 2: detailed organic writhing
      vec2 r = vec2(fbm(uv * 2.5 + 1.7 * q + vec2(1.7, 9.2) + drift * 0.5),
                    fbm(uv * 2.5 + 1.7 * q + vec2(8.3, 2.8)));

      float cloudField = fbm(uv * 3.0 + 1.8 * r);

      // ---- 2. Latitudinal band structure (like real gas giant belts) ----
      // Latitude in [0,1] — strongest bands near equator
      float lat = vUv.y;
      // Warp the latitude with gentle noise for organic band edges
      float warpedLat = lat + cloudField * 0.12;
      // Multiple superimposed sine bands at different scales, like real planet belts
      float bands = sin(warpedLat * 14.0) * 0.4
                  + sin(warpedLat * 28.0 + cloudField * 2.0) * 0.2
                  + sin(warpedLat * 6.0 + r.x * 1.5) * 0.4;
      bands = bands * 0.5 + 0.5; // remap [-1,1] → [0,1]

      // ---- 3. Color blending based on bands + cloud density ----
      vec3 col = uDeepOcean;

      // Base ocean → mid ocean gradient
      col = mix(col, uMidOcean, smoothstep(0.2, 0.65, bands));

      // Bright cloud belt highlights at band peaks
      col = mix(col, uCloudBand, smoothstep(0.55, 0.75, bands));

      // Storm / cyclone swirls — localized bright spots driven by domain warp magnitude
      float stormIntensity = length(r) * 0.5;
      float stormMask = smoothstep(0.3, 0.7, stormIntensity) * smoothstep(0.6, 0.85, bands);
      col = mix(col, uStormHighlight, stormMask * 0.7);

      // ---- 3b. Continent landmasses ----
      // Use a very slow, coarse, independent FBM with a DIFFERENT seed so continents
      // don't align with the cloud bands — they drift at their own rate.
      float continentDrift = uTime * 0.004; // much slower than clouds
      vec2 cUv = vec2(vUv.x + continentDrift, vUv.y);

      // Coarse warp for large blob shapes
      vec2 cq = vec2(fbm(cUv * 0.9 + vec2(31.7, 12.5)),
                     fbm(cUv * 0.9 + vec2(14.3, 47.8)));
      // Continent field — low frequency → large continent-sized blobs
      float continentField = fbm(cUv * 1.1 + 2.0 * cq + vec2(8.2, 61.3));
      // Remap so ~35% of surface is land
      float seaLevel   = 0.05;
      float landHeight = smoothstep(seaLevel,         seaLevel + 0.22, continentField);
      float coastShelf = smoothstep(seaLevel - 0.08,  seaLevel + 0.05, continentField)
                       * (1.0 - landHeight); // only the transition ring

      // Paint coast shallow shelf first, then land on top
      col = mix(col, uCoastColor,     coastShelf * 0.75);
      col = mix(col, uContinentColor, landHeight * 0.9);

      // Polar darkening (poles are darker and calmer on real gas giants)
      float polarFade = pow(sin(lat * 3.14159), 0.4);
      col *= mix(0.45, 1.0, polarFade);

      // ---- 4. Physically-based lighting ----
      vec3 lightDir = normalize(vec3(3.0, 2.0, 5.0)); // Off-angle star light

      float diffuse = max(0.0, dot(N, lightDir));
      // Hemisphere ambient — space is not completely dark on shadow side
      float ambient = 0.12;
      float light = ambient + diffuse * 0.88;

      col *= light;

      // Specular highlight — bright star glint on atmosphere
      vec3 viewDir = normalize(cameraPosition - vWorldPosition);
      vec3 halfDir = normalize(lightDir + viewDir);
      float spec = pow(max(0.0, dot(N, halfDir)), 48.0);
      col += uStormHighlight * spec * 0.25;

      // ---- 5. Atmospheric limb glow (scattering rim light) ----
      float fresnel = pow(1.0 - max(0.0, dot(N, viewDir)), 3.5);
      col += uAtmosphere * fresnel * 1.2;

      gl_FragColor = vec4(col, 1.0);
    }
  `
);

extend({ PlanetCoreMaterial });
