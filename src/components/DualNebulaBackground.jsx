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
        NEBULA 1: Eagle / Carina-style Emission Nebula
        Deep crimson H-alpha body with teal OIII ionization shell and dark dust lanes.
        Pillar columns point upward-right like the "Pillars of Creation".
      */}
      <mesh position={[-35, 20, -40]} rotation={[0.15, 0.3, -0.1]}>
        <planeGeometry args={[220, 160]} />
        <nebulaMaterial
          ref={matRefLayer1}
          uColorSII={new THREE.Color('#d43000')}   // Warm orange-red SII 673nm
          uColorHa={new THREE.Color('#8b0010')}    // Deep crimson H-alpha 656nm
          uColorOIII={new THREE.Color('#006880')}  // Teal OIII 501nm
          uColorCore={new THREE.Color('#ffe0a0')}  // Hot ionization front
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
        NEBULA 2: Rosette / Orion-style Emission Nebula
        Slightly bluer-teal OIII dominant shell with H-alpha filaments.
        Different pillar axis orientation.
      */}
      <mesh position={[45, -15, -30]} rotation={[-0.1, -0.4, 0.15]}>
        <planeGeometry args={[190, 140]} />
        <nebulaMaterial
          ref={matRefLayer2}
          uColorSII={new THREE.Color('#cc2800')}   // Sulfur-II orange-red
          uColorHa={new THREE.Color('#6a000d')}    // H-alpha deep red
          uColorOIII={new THREE.Color('#009999')}  // Brighter OIII teal (Rosette-style)
          uColorCore={new THREE.Color('#fff0d0')}  // Warm ionization core
          uScale={4.5}
          uWarp={3.8}
          uMaskRadius={0.35}
          uEdgeWarp={0.4}
          uAlpha={0.85}
          uBrightness={2.6}
          uDustStrength={0.6}
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
