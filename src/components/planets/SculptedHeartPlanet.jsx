import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import '../../shaders/HeartPlanetShaderMaterial';

export function SculptedHeartPlanet({ color, size, isMobile, perfTierFloat = 0.0 }) {
  const meshRef = useRef();
  const shaderMatRef = useRef();

  // Create perfectly symmetric, upright 3D heart shape
  const heartGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    
    // Pristine upright 2D heart contour centered at origin
    shape.moveTo(0, -0.6);
    // Left cheek / lobe
    shape.bezierCurveTo(-0.65, -0.25, -0.7, 0.45, -0.36, 0.58);
    shape.bezierCurveTo(-0.16, 0.66, 0, 0.42, 0, 0.22);
    // Right cheek / lobe
    shape.bezierCurveTo(0, 0.42, 0.16, 0.66, 0.36, 0.58);
    shape.bezierCurveTo(0.7, 0.45, 0.65, -0.25, 0, -0.6);

    const extrudeSettings = {
      steps: 3,
      depth: 0.35,
      bevelEnabled: true,
      bevelThickness: 0.12,
      bevelSize: 0.09,
      bevelOffset: 0,
      bevelSegments: isMobile ? 4 : 10,
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
      meshRef.current.rotation.y += delta * 0.35;
      meshRef.current.position.y = Math.sin(t * 1.5) * 0.06;
    }
  });

  return (
    <group scale={size * 1.6}>
      <mesh ref={meshRef} geometry={heartGeometry}>
        <heartPlanetShaderMaterial ref={shaderMatRef} transparent depthWrite={true} />
      </mesh>
    </group>
  );
}
