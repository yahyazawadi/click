import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import '../shaders/NebulaShaderMaterial';

export function DualNebulaBackground() {
  const matRefLayer1 = useRef();
  const matRefLayer2 = useRef();

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (matRefLayer1.current) matRefLayer1.current.uTime = time * 0.35;
    if (matRefLayer2.current) matRefLayer2.current.uTime = time * 0.55;
  });

  return (
    <group position={[0, 0, -50]}>
      {/*
        NEBULA 1: Deep Royal Blue / Neon Purple / Electric Cyan Gas Cloud
      */}
      <mesh position={[-35, 20, -40]} rotation={[0.15, 0.3, -0.1]}>
        <planeGeometry args={[220, 160]} />
        <nebulaMaterial
          ref={matRefLayer1}
          uColorSII={new THREE.Color('#9000ff')}   // Neon Purple
          uColorHa={new THREE.Color('#220066')}    // Deep Royal Violet
          uColorOIII={new THREE.Color('#0055ff')}  // Vibrant Royal Blue Shell
          uColorCore={new THREE.Color('#00f0ff')}  // Electric Cyan Core
          uScale={3.2}
          uWarp={2.6}
          uMaskRadius={0.38}
          uEdgeWarp={0.3}
          uAlpha={0.92}
          uBrightness={2.4}
          uPillarStrength={0.65}
          uCoreRadius={0.16}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/*
        NEBULA 2: Vivid Magenta / Electric Cyan / Deep Violet Wisps
      */}
      <mesh position={[45, -15, -30]} rotation={[-0.1, -0.4, 0.15]}>
        <planeGeometry args={[190, 140]} />
        <nebulaMaterial
          ref={matRefLayer2}
          uColorSII={new THREE.Color('#00e5ff')}   // Bright Electric Cyan
          uColorHa={new THREE.Color('#7700ff')}    // Rich Violet
          uColorOIII={new THREE.Color('#ff00aa')}  // Vivid Neon Pink/Magenta Shell
          uColorCore={new THREE.Color('#00f0ff')}  // Electric Cyan Core
          uScale={4.5}
          uWarp={3.8}
          uMaskRadius={0.35}
          uEdgeWarp={0.4}
          uAlpha={0.85}
          uBrightness={2.6}
          uPillarStrength={0.5}
          uCoreRadius={0.20}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}
