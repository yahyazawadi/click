import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

export const HeartPlanetShaderMaterial = shaderMaterial(
  {
    uTime:        0,
    uPerfTier:    0.0,  // 0.0=high, 0.5=med, 1.0=low
    uDeepVoid:    new THREE.Color('#16061a'), // Dark Cosmic Mauve Shadow
    uTerrain:     new THREE.Color('#38122c'), // Deep Berry Continent Base
    uRiverViolet: new THREE.Color('#9F477E'), // Rich Berry Mauve River (#9F477E)
    uRiverPink:   new THREE.Color('#CD6973'), // Soft Rose Coral Glow (#CD6973)
    uCorePink:    new THREE.Color('#e88a94'), // Glowing Heart Core Highlight
    uAtmosphere:  new THREE.Color('#CD6973'), // Rose Fresnel Rim Glow
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
    uniform float uPerfTier;
    uniform vec3  uDeepVoid;
    uniform vec3  uTerrain;
    uniform vec3  uRiverViolet;
    uniform vec3  uRiverPink;
    uniform vec3  uCorePink;
    uniform vec3  uAtmosphere;

    varying vec2 vUv;
    varying vec3 vWorldNormal;
    varying vec3 vWorldPosition;
    varying vec3 vPosition;

    // ── 3D Noise Helper Functions ──────────────────────────────────────────
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
      float v = 0.0;
      float a = 0.5;
      vec3 shift = vec3(100.0);
      for (int i = 0; i < 4; ++i) {
        v += a * noise(p);
        p = p * 2.0 + shift;
        a *= 0.5;
      }
      return v;
    }

    float heartSDF(vec2 p) {
      p.x = abs(p.x);
      if( p.y + p.x > 1.0 )
          return sqrt(dot(p-vec2(0.25,0.75),p-vec2(0.25,0.75))) - 0.3535;
      return sqrt(min(dot(p-vec2(0.00,1.00),p-vec2(0.00,1.00)),
                      dot(p-0.5*vec2(p.x+p.y,p.x+p.y),p-0.5*vec2(p.x+p.y,p.x+p.y)))) * sign(p.x-p.y);
    }

    void main() {
      vec3 pos = vPosition;
      vec3 normPos = normalize(vPosition);
      float t = uTime * 0.15;

      // Domain warping for organic river flow
      vec3 q = vec3(fbm(pos * 2.5 + vec3(0.0, t, 0.0)),
                    fbm(pos * 2.5 + vec3(5.2, 1.3, t * 0.8)),
                    fbm(pos * 2.5 + vec3(1.7, 9.2, 0.4)));

      vec3 r = vec3(fbm(pos * 4.0 + 4.0 * q + vec3(1.7, 9.2, t * 1.2)),
                    fbm(pos * 4.0 + 4.0 * q + vec3(8.3, 2.8, 0.0)),
                    fbm(pos * 4.0 + 4.0 * q + vec3(3.1, 0.4, t * 0.5)));

      float riverValue = fbm(pos * 3.5 + 3.0 * r);
      
      // Carve out narrow glowing river channels
      float rivers = smoothstep(0.12, 0.01, abs(riverValue - 0.1));

      // Front hemisphere Heart Basin check (for sphere)
      vec2 uvHeart = vec2(atan(normPos.x, normPos.z) / 3.14159, normPos.y);
      uvHeart.y *= 1.25;
      uvHeart.y += 0.05;
      float dHeart = heartSDF(uvHeart * 2.2);
      float heartMask = smoothstep(0.08, -0.15, dHeart);

      // Base terrain mix
      vec3 col = mix(uDeepVoid, uTerrain, fbm(pos * 2.5 + q) * 0.5 + 0.5);

      // Add violet & pink glowing rivers
      float riverPulse = sin(uTime * 2.0 + riverValue * 10.0) * 0.25 + 0.75;
      vec3 riverColor = mix(uRiverViolet, uRiverPink, sin(riverValue * 12.0 + uTime) * 0.5 + 0.5);
      
      // Inject river energy
      col = mix(col, riverColor * 1.8 * riverPulse, rivers);
      col = mix(col, uCorePink * 2.2, heartMask * 0.65 * (0.8 + 0.2 * sin(uTime * 3.0)));

      // Fresnel Atmospheric Glow
      vec3 viewDir = normalize(cameraPosition - vWorldPosition);
      float fresnel = pow(1.0 - max(0.0, dot(vWorldNormal, viewDir)), 3.0);
      col += uAtmosphere * fresnel * 1.6;

      gl_FragColor = vec4(col, 1.0);
    }
  `
);

extend({ HeartPlanetShaderMaterial });
