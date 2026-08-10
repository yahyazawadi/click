import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

export const PlanetCoreMaterial = shaderMaterial(
  {
    uTime: 0,
    uIsMobile: 0.0,
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
    varying vec3 vPosition;

    void main() {
      vUv = uv;
      vPosition = position;
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
    uniform float uIsMobile;
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
    varying vec3 vPosition;

    // ---- Noise infrastructure ----
    vec3 hash3(vec3 p) {
      p = vec3(dot(p, vec3(127.1, 311.7, 74.7)),
               dot(p, vec3(269.5, 183.3, 246.1)),
               dot(p, vec3(113.5, 271.9, 124.6)));
      return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
    }

    float noise(vec3 p) {
      vec3 i = floor(p);
      vec3 f = fract(p);
      vec3 u = f * f * (3.0 - 2.0 * f);
      return mix( mix( mix( dot( hash3(i + vec3(0.0,0.0,0.0)), f - vec3(0.0,0.0,0.0) ),
                            dot( hash3(i + vec3(1.0,0.0,0.0)), f - vec3(1.0,0.0,0.0) ), u.x),
                       mix( dot( hash3(i + vec3(0.0,1.0,0.0)), f - vec3(0.0,1.0,0.0) ),
                            dot( hash3(i + vec3(1.0,1.0,0.0)), f - vec3(1.0,1.0,0.0) ), u.x), u.y),
                  mix( mix( dot( hash3(i + vec3(0.0,0.0,1.0)), f - vec3(0.0,0.0,1.0) ),
                            dot( hash3(i + vec3(1.0,0.0,1.0)), f - vec3(1.0,0.0,1.0) ), u.x),
                       mix( dot( hash3(i + vec3(0.0,1.0,1.0)), f - vec3(0.0,1.0,1.0) ),
                            dot( hash3(i + vec3(1.0,1.0,1.0)), f - vec3(1.0,1.0,1.0) ), u.x), u.y), u.z );
    }

    // Adaptive 3D FBM (2 octaves on mobile vs 6 on desktop)
    float fbm(vec3 p) {
      float v = 0.0;
      float a = 0.5;
      mat3 rot = mat3(
          0.36,  0.48, -0.80,
         -0.80,  0.60,  0.00,
          0.48,  0.64,  0.60
      );
      int count = uIsMobile > 0.5 ? 2 : 6;
      for (int i = 0; i < 6; i++) {
        if (i >= count) break;
        v += a * noise(p);
        p = rot * p * 2.03 + vec3(3.1, 7.4, 1.9);
        a *= 0.5;
      }
      return v;
    }

    void main() {
      // World-space Normal
      vec3 N = normalize(vWorldNormal);

      // ---- 1. Organic atmospheric cloud bands ----
      float drift = uTime * 0.025;
      float c = cos(drift);
      float s = sin(drift);
      mat3 rotY = mat3(c, 0.0, s, 0.0, 1.0, 0.0, -s, 0.0, c);
      vec3 p = normalize(vPosition);
      vec3 driftP = rotY * p;

      vec2 q = vec2(fbm(driftP * 2.0), fbm(driftP * 2.0 + vec3(5.2, 1.3, 2.9)));
      
      vec3 driftP2 = rotY * (p * 2.5) + vec3(1.7 * q.x, 1.7 * q.y, 0.0);
      vec2 r = vec2(fbm(driftP2 + vec3(1.7, 9.2, 4.3)),
                    fbm(driftP2 + vec3(8.3, 2.8, 1.1)));

      float cloudField = fbm(driftP * 3.0 + vec3(1.8 * r.x, 1.8 * r.y, 0.0));

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
      float cC = cos(continentDrift);
      float cS = sin(continentDrift);
      mat3 rotCY = mat3(cC, 0.0, cS, 0.0, 1.0, 0.0, -cS, 0.0, cC);
      vec3 cP = rotCY * p;

      float continentField;
      if (uIsMobile > 0.5) {
        continentField = fbm(cP * 1.1 + vec3(8.2, 61.3, 3.4));
      } else {
        vec2 cq = vec2(fbm(cP * 0.7 + vec3(31.7, 12.5, 4.1)),
                       fbm(cP * 0.7 + vec3(14.3, 47.8, 2.2)));
        continentField = fbm(cP * 0.9 + vec3(0.5 * cq.x, 0.5 * cq.y, 0.0) + vec3(8.2, 61.3, 3.4));
      }

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
