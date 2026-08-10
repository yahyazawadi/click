import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

export const NebulaMaterial = shaderMaterial(
  {
    uTime: 0,
    uColor1: new THREE.Color('#000000'),
    uColor2: new THREE.Color('#c40045'),
    uColor3: new THREE.Color('#9900ff'),
    uScale: 3.5,
    uWarp: 2.5,
    uMaskRadius: 0.38,
    uEdgeWarp: 0.25,
    uParallaxOffset: new THREE.Vector2(0, 0),
    uAlpha: 1.0,
    uBrightness: 2.2,
    uDustStrength: 0.55,
  },
  // Vertex Shader
  /* glsl */ `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment Shader — High-octave FBM + Dark Dust Absorption Lanes
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
    uniform float uDustStrength;

    varying vec2 vUv;

    // --- Noise Infrastructure ---
    vec2 hash2(vec2 p) {
      p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
      return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
    }

    float noise(vec2 p) {
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

    // High-octave FBM (8 octaves) for realistic gas filament detail
    float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      mat2 rot = mat2(0.80, 0.60, -0.60, 0.80);
      for (int i = 0; i < 8; i++) {
        v += a * noise(p);
        p  = rot * p * 2.07 + vec2(13.4, 27.9);
        a *= 0.48;
      }
      return v;
    }

    // Separate dust FBM — different seed / scale for independent absorption structure
    float dustFbm(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      mat2 rot = mat2(0.62, 0.78, -0.78, 0.62);
      for (int i = 0; i < 6; i++) {
        v += a * noise(p);
        p  = rot * p * 1.97 + vec2(4.1, 51.3);
        a *= 0.52;
      }
      return v * 0.5 + 0.5; // remap to [0,1]
    }

    void main() {
      vec2 centeredUv = vUv - vec2(0.5);

      // 1. Hard radial plane-edge kill
      float edgeDist = length(centeredUv);
      float planeEdgeFade = smoothstep(0.45, 0.15, edgeDist);

      // 2. Organic noise mask
      float angle   = atan(centeredUv.y, centeredUv.x);
      float edgeN   = fbm(vec2(angle * 2.5, uTime * 0.012) + centeredUv * 2.0) * uEdgeWarp;
      float organicMask = smoothstep(uMaskRadius, uMaskRadius * 0.1, edgeDist + edgeN);

      // 3. Domain-warped gas density (two warp levels)
      vec2 uv = centeredUv * uScale + uParallaxOffset;
      vec2 q;
      q.x = fbm(uv + vec2(0.0,  uTime * 0.018));
      q.y = fbm(uv + vec2(5.2,  uTime * 0.013));
      vec2 r;
      r.x = fbm(uv + uWarp * q + vec2(1.7, uTime * 0.010));
      r.y = fbm(uv + uWarp * q + vec2(8.3, uTime * 0.016));
      float density = fbm(uv + uWarp * r);

      float gasDensity = smoothstep(0.0, 0.5, density);

      // 4. Dark dust absorption lanes
      //    dustField peaks where gas also peaks → creates realistic dark rifts inside bright clouds
      vec2 dustUv = centeredUv * uScale * 0.72 + uParallaxOffset + vec2(17.3, 8.1);
      float dustField = dustFbm(dustUv + vec2(uTime * 0.008, -uTime * 0.006));
      // Dust only absorbs inside gas regions, giving dark filaments on bright nebula
      float absorption = pow(dustField, 2.5) * uDustStrength;
      float gasAfterDust = max(0.0, gasDensity - absorption * gasDensity);

      // 5. Gas color
      vec3 col = mix(uColor2, uColor3, smoothstep(0.0, 0.7, length(q)));
      col += uColor3 * pow(gasAfterDust, 2.0) * 1.2;
      col *= uBrightness;

      // 6. Alpha
      float alpha = clamp(gasAfterDust * organicMask * planeEdgeFade * uAlpha, 0.0, 1.0);

      gl_FragColor = vec4(col, alpha);
    }
  `
);

extend({ NebulaMaterial });
