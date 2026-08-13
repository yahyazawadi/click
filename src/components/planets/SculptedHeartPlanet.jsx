import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import '../../shaders/HeartPlanetShaderMaterial';

export function SculptedHeartPlanet({ color, size, isMobile, perfTierFloat = 0.0 }) {
  const meshRef = useRef();
  const shaderMatRef = useRef();

  // Create smooth extruded 3D heart shape
  const heartGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    
    // Perfect symmetrical 2D heart shape definition
    shape.moveTo(0, 0.25);
    shape.bezierCurveTo(0, 0.45, -0.6, 0.75, -0.6, 0.25);
    shape.bezierCurveTo(-0.6, -0.15, -0.2, -0.45, 0, -0.75);
    shape.bezierCurveTo(0.2, -0.45, 0.6, -0.15, 0.6, 0.25);
    shape.bezierCurveTo(0.6, 0.75, 0, 0.45, 0, 0.25);

    const extrudeSettings = {
      steps: 2,
      depth: 0.3,
      bevelEnabled: true,
      bevelThickness: 0.12,
      bevelSize: 0.1,
      bevelOffset: 0,
      bevelSegments: isMobile ? 4 : 8,
    };

    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geo.center();
    return geo;
  }, [isMobile]);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();

    if (shaderMatRef.current) {
      shaderMatRef.current.uTime = t;
      shaderMatRef.current.uPerfTier = perfTierFloat;
    }

    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.4;
      meshRef.current.position.y = Math.sin(t * 1.5) * 0.08;
    }
  });

  return (
    <group scale={size * 1.2}>
      <mesh ref={meshRef} geometry={heartGeometry}>
        <heartPlanetShaderMaterial ref={shaderMatRef} transparent depthWrite={true} />
      </mesh>
    </group>
  );
}
