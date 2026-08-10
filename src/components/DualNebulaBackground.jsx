import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import '../shaders/NebulaShaderMaterial';

export function DualNebulaBackground() {
  const matRefLayer1 = useRef();
  const matRefLayer2 = useRef();

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    // Slow fluid gas motion inside the nebulae
    if (matRefLayer1.current) {
      matRefLayer1.current.uTime = time * 0.35;
    }
    if (matRefLayer2.current) {
      matRefLayer2.current.uTime = time * 0.55;
    }
  });

  return (
    <group position={[0, 0, -50]}>
      {/* NEBULA 1: Deep Crimson & Violet Cloud Cluster (Rotates with planet system) */}
      <mesh position={[-45, 25, -40]} rotation={[0.15, 0.3, -0.1]}>
        <planeGeometry args={[260, 190]} />
        <nebulaMaterial
          ref={matRefLayer1}
          uColor1={new THREE.Color('#08001a')} // Dark Indigo Base
          uColor2={new THREE.Color('#c40045')} // Vibrant Crimson Gas Mass
          uColor3={new THREE.Color('#9900ff')} // Bright Violet Core Glow
          uScale={3.5}
          uWarp={2.6}
          uAlpha={0.92}
          uBrightness={2.2}
          transparent
          depthWrite={false}
        />
      </mesh>

      {/* NEBULA 2: Magenta & Cyan Filament Cluster (Rotates with planet system) */}
      <mesh position={[50, -20, -30]} rotation={[-0.1, -0.4, 0.15]}>
        <planeGeometry args={[220, 160]} />
        <nebulaMaterial
          ref={matRefLayer2}
          uColor1={new THREE.Color('#000000')} // Transparent Base
          uColor2={new THREE.Color('#ff007f')} // Electric Magenta Wisps
          uColor3={new THREE.Color('#00f0ff')} // Glowing Cyan Highlights
          uScale={5.0}
          uWarp={3.8}
          uAlpha={0.85}
          uBrightness={2.4}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}
