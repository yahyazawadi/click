import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const StarfieldShaderMaterial = {
  uniforms: {
    uTime: { value: 0 },
    uSizeFactor: { value: 1.0 },
  },
  vertexShader: /* glsl */ `
    uniform float uTime;
    uniform float uSizeFactor;

    attribute float aSize;
    attribute vec3 aColor;
    attribute float aPhase;
    attribute float aSpeed;

    varying vec3 vColor;
    varying float vTwinkle;
    varying float vIsHero;

    void main() {
      vColor = aColor;
      vIsHero = aSize > 4.0 ? 1.0 : 0.0;

      // Dual-frequency organic wave math for asynchronous non-uniform flickering
      float wave1 = sin(uTime * aSpeed + aPhase);
      float wave2 = cos(uTime * aSpeed * 0.731 + aPhase * 1.618);
      float wave3 = sin(uTime * aSpeed * 1.370 + aPhase * 0.420);

      // Smooth flickering range between 0.35 and 1.0
      float twinkle = 0.5 + 0.3 * wave1 + 0.15 * wave2 + 0.05 * wave3;
      vTwinkle = clamp(twinkle, 0.35, 1.0);

      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * mvPosition;

      // Significantly smaller star sizes with camera distance attenuation
      float dynamicSize = aSize * uSizeFactor * (0.85 + 0.25 * vTwinkle);
      gl_PointSize = dynamicSize * (220.0 / -mvPosition.z);
    }
  `,
  fragmentShader: /* glsl */ `
    varying vec3 vColor;
    varying float vTwinkle;
    varying float vIsHero;

    void main() {
      // Point sprite center distance calculation (-0.5 to 0.5)
      vec2 coord = gl_PointCoord - vec2(0.5);
      float dist = length(coord);

      if (dist > 0.5) discard;

      // 1. Soft Circular Core & Glow
      float coreMask = smoothstep(0.18, 0.0, dist); // Hot white core
      float haloAlpha = smoothstep(0.5, 0.04, dist); // Soft circular glow

      // 2. Subtle 4-Pointed Cross Star Flare (Diffraction Spikes)
      float spikeWidth = 0.035;
      float spikeX = smoothstep(spikeWidth, 0.0, abs(coord.y)) * smoothstep(0.48, 0.0, abs(coord.x));
      float spikeY = smoothstep(spikeWidth, 0.0, abs(coord.x)) * smoothstep(0.48, 0.0, abs(coord.y));
      float fourPointCross = max(spikeX, spikeY) * (0.35 + 0.45 * vTwinkle);

      // Combine circular halo with subtle 4-pointed star flare
      float starShape = max(haloAlpha * 0.7, fourPointCross * vIsHero * 0.65 + fourPointCross * 0.25);

      // 3. Color Shimmer & White Core Blending
      vec3 hotWhite = vec3(1.0, 1.0, 1.0);
      float shimmer = (vTwinkle - 0.35) * 0.25;
      vec3 starColor = mix(vColor, hotWhite, clamp(coreMask * 0.85 + shimmer + fourPointCross * 0.3, 0.0, 1.0));

      float finalAlpha = starShape * (0.35 + 0.65 * vTwinkle);

      gl_FragColor = vec4(starColor, finalAlpha);
    }
  `,
};

export function EnhancedStarfield({ count = 1200, radius = 100, depth = 50, factor = 4 }) {
  const materialRef = useRef();

  // Generate Geometry Attributes once per count/radius/depth configuration
  const { positions, sizes, colors, phases, speeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const colors = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    const speeds = new Float32Array(count);

    // Stellar classification color palettes
    const cyan = new THREE.Color('#00f0ff');
    const iceBlue = new THREE.Color('#5dbae1');
    const pureWhite = new THREE.Color('#ffffff');
    const warmGold = new THREE.Color('#ffb700');
    const amberMagenta = new THREE.Color('#e056fd');
    const softOrange = new THREE.Color('#ff7b00');

    for (let i = 0; i < count; i++) {
      // 1. Position Math (identical spherical shell distribution to Drei Stars)
      const r = radius + (Math.random() - 0.5) * depth;
      const theta = 2 * Math.PI * Math.random();
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      // 2. Significantly Smaller Multi-Tier Sizes
      const sizeRand = Math.random();
      if (sizeRand < 0.72) {
        // Micro background dust (0.8px - 1.8px)
        sizes[i] = (0.8 + Math.random() * 1.0) * (factor / 4);
      } else if (sizeRand < 0.94) {
        // Medium stars (2.0px - 3.8px)
        sizes[i] = (2.0 + Math.random() * 1.8) * (factor / 4);
      } else {
        // Subtle hero stars with 4-point flare (4.5px - 6.5px)
        sizes[i] = (4.5 + Math.random() * 2.0) * (factor / 4);
      }

      // 3. Stellar Classification Color Distribution
      const colorRand = Math.random();
      let pickedColor;
      if (colorRand < 0.45) {
        pickedColor = pureWhite;
      } else if (colorRand < 0.70) {
        pickedColor = Math.random() > 0.5 ? cyan : iceBlue;
      } else if (colorRand < 0.88) {
        pickedColor = warmGold;
      } else {
        pickedColor = Math.random() > 0.5 ? amberMagenta : softOrange;
      }

      colors[i * 3 + 0] = pickedColor.r;
      colors[i * 3 + 1] = pickedColor.g;
      colors[i * 3 + 2] = pickedColor.b;

      // 4. Asynchronous Flickering Seeds
      phases[i] = Math.random() * 100.0;
      speeds[i] = 0.8 + Math.random() * 2.2;
    }

    return { positions, sizes, colors, phases, speeds };
  }, [count, radius, depth, factor]);

  // Zero-CPU overhead: Update GPU time uniform in frame loop
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-aSize" count={count} array={sizes} itemSize={1} />
        <bufferAttribute attach="attributes-aColor" count={count} array={colors} itemSize={3} />
        <bufferAttribute attach="attributes-aPhase" count={count} array={phases} itemSize={1} />
        <bufferAttribute attach="attributes-aSpeed" count={count} array={speeds} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        args={[StarfieldShaderMaterial]}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
