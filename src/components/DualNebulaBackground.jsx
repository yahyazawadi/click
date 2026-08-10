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
        NEBULA 1 (LEFT): Deep Violet / Crimson Gas Cloud (Kept as requested)
      */}
      <mesh position={[-35, 20, -40]} rotation={[0.15, 0.3, -0.1]}>
        <planeGeometry args={[220, 160]} />
        <nebulaMaterial
          ref={matRefLayer1}
          uColorSII={new THREE.Color('#9900cc')}   // Dense magenta knots
          uColorHa={new THREE.Color('#c40045')}    // Vivid crimson body
          uColorOIII={new THREE.Color('#5500bb')}  // Electric violet outer shell
          uColorCore={new THREE.Color('#c0f0ff')}  // Pale cyan-white ionization core
          uScale={3.2}
          uWarp={2.6}
          uMaskRadius={0.38}
          uEdgeWarp={0.3}
          uAlpha={0.92}
          uBrightness={2.4}
          uDustStrength={0.55}
          uPillarStrength={0.65}
          uCoreRadius={0.16}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/*
        NEBULA 2 (RIGHT): Deep Cosmic Indigo & Cyan Wisp Cloud
        Replaced greyish / dull tones with rich cosmic indigo, deep violet-blue,
        and vibrant glowing electric cyan wisps.
      */}
      <mesh position={[45, -15, -30]} rotation={[-0.1, -0.4, 0.15]}>
        <planeGeometry args={[190, 140]} />
        <nebulaMaterial
          ref={matRefLayer2}
          uColorSII={new THREE.Color('#00f0ff')}   // Vibrant Electric Cyan Wisps
          uColorHa={new THREE.Color('#0d1b40')}    // Deep Cosmic Midnight Blue Body
          uColorOIII={new THREE.Color('#410099')}  // Rich Royal Indigo/Purple Outer Cloud
          uColorCore={new THREE.Color('#a6f6ff')}  // Bright Glowing Cyan-White Core
          uScale={4.5}
          uWarp={3.8}
          uMaskRadius={0.35}
          uEdgeWarp={0.4}
          uAlpha={0.88}
          uBrightness={2.8}
          uDustStrength={0.35}                    // Reduced dark dust intensity to eliminate grayish haze
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
