import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import '../shaders/NebulaShaderMaterial';

export function DualNebulaBackground() {
  const matRefLayer1 = useRef();
  const matRefLayer2 = useRef();

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    if (matRefLayer1.current) {
      matRefLayer1.current.uTime = time * 0.35;
    }
    if (matRefLayer2.current) {
      matRefLayer2.current.uTime = time * 0.55;
    }
  });

  return (
    <group position={[0, 0, -50]}>
      {/* NEBULA 1: Deep Crimson & Violet Gas Cloud Sector (100% Seamless Soft Edge Dissipation) */}
      <mesh position={[-35, 20, -40]} rotation={[0.15, 0.3, -0.1]}>
        <planeGeometry args={[220, 160]} />
        <nebulaMaterial
          ref={matRefLayer1}
          uColor1={new THREE.Color('#000000')}
          uColor2={new THREE.Color('#b80036')} // Vibrant Crimson Gas Cloud Mass
          uColor3={new THREE.Color('#8a00e6')} // Violet Core Emission
          uScale={3.2}
          uWarp={2.6}
          uMaskRadius={0.38}
          uEdgeWarp={0.3}
          uAlpha={0.92}
          uBrightness={2.4}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* NEBULA 2: Magenta & Electric Cyan Gas Wisps */}
      <mesh position={[45, -15, -30]} rotation={[-0.1, -0.4, 0.15]}>
        <planeGeometry args={[190, 140]} />
        <nebulaMaterial
          ref={matRefLayer2}
          uColor1={new THREE.Color('#000000')}
          uColor2={new THREE.Color('#ff007f')} // Electric Magenta Filament
          uColor3={new THREE.Color('#00f0ff')} // Cyan Highlight Wisps
          uScale={4.5}
          uWarp={3.8}
          uMaskRadius={0.35}
          uEdgeWarp={0.4}
          uAlpha={0.85}
          uBrightness={2.6}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}
