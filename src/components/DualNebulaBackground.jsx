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
        NEBULA 1: Deep Violet / Crimson Gas Cloud — portfolio's left-side nebula.
        Outer wisps: electric violet  (#6600cc)
        Mid body:    vivid crimson    (#c40045)  ← original hero color
        Dense knots: deep magenta     (#9900cc)
        Hot core:    pale cyan-white  (#c0f0ff)  ← matches UI accent
        Dark dust lanes cut across giving realistic depth.
      */}
      <mesh position={[-35, 20, -40]} rotation={[0.15, 0.3, -0.1]}>
        <planeGeometry args={[220, 160]} />
        <nebulaMaterial
          ref={matRefLayer1}
          uColorSII={new THREE.Color('#9900cc')}   // Dense magenta knots (replaces SII orange)
          uColorHa={new THREE.Color('#c40045')}    // Vivid crimson body  (portfolio hero color)
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
        NEBULA 2: Magenta / Electric Cyan Wisps — portfolio's right-side nebula.
        Outer wisps: deep magenta     (#cc007a)
        Mid body:    violet           (#8800dd)
        Dense knots: electric cyan    (#00d4ff)  ← UI ring / orbit color
        Hot core:    bright white     (#e8f8ff)
      */}
      <mesh position={[45, -15, -30]} rotation={[-0.1, -0.4, 0.15]}>
        <planeGeometry args={[190, 140]} />
        <nebulaMaterial
          ref={matRefLayer2}
          uColorSII={new THREE.Color('#00c8e8')}   // Electric cyan dense regions
          uColorHa={new THREE.Color('#8800dd')}    // Deep violet body
          uColorOIII={new THREE.Color('#cc007a')}  // Magenta outer shell
          uColorCore={new THREE.Color('#e8f8ff')}  // Near-white hot core
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
