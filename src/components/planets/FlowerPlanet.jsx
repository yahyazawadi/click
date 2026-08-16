import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import '../../shaders/HeartPlanetShaderMaterial';

export function FlowerPlanet({ color, size, isMobile, perfTierFloat = 0.0 }) {
  const meshRef = useRef();
  const shaderMatRef = useRef();
  const ringRef = useRef();

  const planetRadius = size * 0.95;

  // Create smooth 6-petal blooming flower 3D geometry
  const flowerGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    const petals = 6;
    const innerRadius = 0.25;
    const outerRadius = 0.9;

    shape.moveTo(innerRadius, 0);

    for (let i = 0; i < petals; i++) {
      const midAngle = ((i + 0.5) / petals) * Math.PI * 2;
      const endAngle = ((i + 1) / petals) * Math.PI * 2;

      // Petal outer curved tip
      const cpx = Math.cos(midAngle) * outerRadius * 1.3;
      const cpy = Math.sin(midAngle) * outerRadius * 1.3;

      // Next petal base notch
      const endx = Math.cos(endAngle) * innerRadius;
      const endy = Math.sin(endAngle) * innerRadius;

      shape.quadraticCurveTo(cpx, cpy, endx, endy);
    }

    const extrudeSettings = {
      steps: 2,
      depth: 0.3,
      bevelEnabled: true,
      bevelThickness: 0.12,
      bevelSize: 0.08,
      bevelOffset: 0,
      bevelSegments: isMobile ? 3 : 6,
    };

    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geo.center();
    return geo;
  }, [isMobile]);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    const safeDelta = Math.min(delta, 0.1);

    if (shaderMatRef.current) {
      shaderMatRef.current.uTime = t;
      shaderMatRef.current.uPerfTier = perfTierFloat;
    }

    if (meshRef.current) {
      meshRef.current.rotation.z += safeDelta * 0.25;
      meshRef.current.rotation.y = Math.sin(t * 0.8) * 0.2;
    }

    if (ringRef.current) {
      ringRef.current.rotation.z += safeDelta * 0.12;
      ringRef.current.rotation.x = Math.sin(t * 0.5) * 0.1 + 0.4;
    }
  });

  return (
    <group scale={size * 1.15}>
      {/* 3D Blooming Flower Petals & Central Cylinder */}
      <group ref={meshRef}>
        <mesh geometry={flowerGeometry}>
          <heartPlanetShaderMaterial ref={shaderMatRef} transparent depthWrite={true} />
        </mesh>

        {/* Balanced Golden Yellow Central Flower Receptacle Button */}
        <mesh position={[0, 0, 0.07]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[planetRadius * 0.35, planetRadius * 0.35, 0.52, 32]} />
          <meshStandardMaterial
            color="#FFC837"
            emissive="#FF8000"
            emissiveIntensity={0.55}
            roughness={0.35}
            metalness={0.2}
          />
        </mesh>
      </group>

      {/* Floating Stardust Ring */}
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
