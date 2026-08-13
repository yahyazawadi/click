import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import '../../shaders/HeartPlanetShaderMaterial';

export function HeartRiversPlanet({ color, size, isMobile, perfTierFloat = 0.0 }) {
  const planetRef = useRef();
  const shaderMatRef = useRef();
  const ringRef = useRef();

  const planetRadius = size * 0.95;

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();

    if (shaderMatRef.current) {
      shaderMatRef.current.uTime = t;
      shaderMatRef.current.uPerfTier = perfTierFloat;
    }

    if (planetRef.current) {
      planetRef.current.rotation.y += delta * 0.18;
    }

    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.12;
      ringRef.current.rotation.x = Math.sin(t * 0.5) * 0.1 + 0.4;
    }
  });

  return (
    <group>
      {/* Main Sphere Planet with Pinky Violet Rivers Shader */}
      <mesh ref={planetRef}>
        <sphereGeometry args={[planetRadius, isMobile ? 32 : 64, isMobile ? 32 : 64]} />
        <heartPlanetShaderMaterial ref={shaderMatRef} transparent depthWrite={true} />
      </mesh>

      {/* Soft Floating Pinky-Violet Dust Ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 3, 0, 0]}>
        <ringGeometry args={[planetRadius * 1.3, planetRadius * 1.65, 64]} />
        <meshBasicMaterial
          color="#CD6973"
          side={THREE.DoubleSide}
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}
