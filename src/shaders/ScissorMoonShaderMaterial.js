import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

export const ScissorMoonShaderMaterial = shaderMaterial(
  {
    uTime:       0,
    uIsMobile:   0.0,
    uDeepSea:    new THREE.Color('#031224'),
    uMidSea:     new THREE.Color('#07304d'),
    uShallowSea: new THREE.Color('#0f5d75'),
    uCoast:      new THREE.Color('#1a7b94'),
    uLand:       new THREE.Color('#254859'),
    uForest:     new THREE.Color('#163242'),
    uPolarIce:   new THREE.Color('#dce8f8'),
    uCloud:      new THREE.Color('#f2f8ff'),
    uAtmosphere: new THREE.Color('#4a90c8'),
    uStorm:      new THREE.Color('#00d4f0'),
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
    uniform float uIsMobile;
    uniform vec3  uDeepSea;
    uniform vec3  uMidSea;
    uniform vec3  uShallowSea;
    uniform vec3  uCoast;
    uniform vec3  uLand;
    uniform vec3  uForest;
    uniform vec3  uPolarIce;
    uniform vec3  uCloud;
    uniform vec3  uAtmosphere;
    uniform vec3  uStorm;

    varying vec2 vUv;
    varying vec3 vWorldNormal;
    varying vec3 vWorldPosition;
    varying vec3 vPosition;

    // ── 3D Value Noise Infrastructure ──────────────────────────────────────
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
      float v = 0.0, a = 0.5;
      mat3 rot = mat3( 0.36, 0.48,-0.80,
                      -0.80, 0.60, 0.00,
                       0.48, 0.64, 0.60);
      int count = uIsMobile > 0.5 ? 2 : 3;
      for (int i = 0; i < 3; i++) {
        if (i >= count) break;
        v += a * noise(p);
        p  = rot * p * 2.03 + vec3(3.1, 7.4, 1.9);
        a *= 0.5;
      }
      return v;
    }

    // Rotation matrix around Y
    mat3 rotY(float a) {
      float c = cos(a), s = sin(a);
      return mat3(c, 0, s,  0, 1, 0,  -s, 0, c);
    }

    void main() {
      vec3 N  = normalize(vWorldNormal);
      vec3 p  = normalize(vPosition);  // seamless sphere coords

      // Latitude: +1 = north pole, -1 = south pole
      float lat = p.y;

      // ── 1. Ocean base ────────────────────────────────────────────────────
      vec3  dP  = rotY(uTime * 0.016) * p;
      vec2  q   = vec2(fbm(dP * 1.9), fbm(dP * 1.9 + vec3(5.2, 1.3, 2.9)));
      vec3  dP2 = rotY(uTime * 0.016) * (p * 2.3) + vec3(1.7*q.x, 1.7*q.y, 0.0);
      vec2  r   = vec2(fbm(dP2 + vec3(1.7, 9.2, 4.3)),
                       fbm(dP2 + vec3(8.3, 2.8, 1.1)));
      float oceanField = fbm(dP * 2.6 + vec3(1.8*r.x, 1.8*r.y, 0.0));

      vec3 col = uDeepSea;
      col = mix(col, uMidSea,     smoothstep(-0.25, 0.20, oceanField));
      col = mix(col, uShallowSea, smoothstep( 0.10, 0.42, oceanField));

      // ── 2. Continents ────────────────────────────────────────────────────
      vec3  cP  = rotY(uTime * 0.003) * p;
      vec2  cq  = vec2(fbm(cP * 0.65 + vec3(31.7, 12.5, 4.1)),
                       fbm(cP * 0.65 + vec3(14.3, 47.8, 2.2)));
      float cont  = fbm(cP * 1.05 + vec3(0.5*cq.x, 0.5*cq.y, 0.0) + vec3(8.2, 61.3, 3.4));
      float terr  = fbm(cP * 3.8  + vec3(14.0, 7.0, 22.0));

      float seaLvl    = -0.09;
      float landH     = smoothstep(seaLvl, seaLvl + 0.28, cont);
      float coast     = smoothstep(seaLvl - 0.14, seaLvl + 0.04, cont) * (1.0 - landH);
      float forestM   = smoothstep(seaLvl + 0.14, seaLvl + 0.42, cont)
                      * smoothstep(0.28, 0.0, abs(lat))
                      * smoothstep(-0.1, 0.32, terr);

      col = mix(col, uCoast,  coast  * 0.92);
      col = mix(col, uLand,   landH);
      col = mix(col, uForest, forestM * landH * 0.88);

      // Terrain micro-shadows/highlights
      col = mix(col, col * 0.72, landH * smoothstep(0.38, 0.90, terr) * 0.38);
      col = mix(col, col * 1.22, landH * smoothstep(-0.5, -0.1, terr) * 0.28);

      // ── 3. Polar Ice Caps ─────────────────────────────────────────────────
      float iceN   = fbm(p * 4.2 + vec3(99.0)) * 0.11;
      float northI = smoothstep(0.70, 0.88, lat);
      float southI = smoothstep(-0.70, -0.88, -lat);
      float ice    = smoothstep(0.0, 0.5, max(northI, southI) + iceN);
      col = mix(col, uPolarIce, ice);

      // ── 4. Cloud Layer ───────────────────────────────────────────────────
      vec3  clP   = rotY(uTime * 0.030) * p;
      float cl1   = fbm(clP * 3.6 + vec3(21.0, 5.0, 11.0));
      float cl2   = fbm(clP * 2.3 + vec3( 3.0,17.0,  8.0));
      float cloud = smoothstep(0.08, 0.52, cl1 * 0.60 + cl2 * 0.40);
      cloud      *= (1.0 - ice * 0.55);
      col = mix(col, uCloud, cloud * 0.80);

      // ── 5. PBR Lighting (World Space) ────────────────────────────────────
      vec3  lightDir = normalize(vec3(-30.0, 20.0, 15.0) - vWorldPosition);
      float diffuse  = max(0.0, dot(N, lightDir));
      col *= (0.22 + diffuse * 0.88);

      // Ocean specularity
      vec3  viewDir  = normalize(cameraPosition - vWorldPosition);
      vec3  halfDir  = normalize(lightDir + viewDir);
      float spec     = pow(max(0.0, dot(N, halfDir)), 52.0);
      col += uStorm * spec * (1.0 - landH) * (1.0 - ice) * 0.48;

      // ── 6. Fresnel Atmosphere Limb Glow ──────────────────────────────────
      float fresnel = pow(1.0 - max(0.0, dot(N, viewDir)), 3.0);
      col += uAtmosphere * fresnel * 0.72;

      gl_FragColor = vec4(col, 1.0);
    }
  `
);

extend({ ScissorMoonShaderMaterial });
