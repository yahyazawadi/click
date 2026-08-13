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
    const x = 0, y = 0;
    
    // Heart shape curve definition
    shape.moveTo(x + 0.25, y + 0.25);
    shape.bezierCurveTo(x + 0.25, y + 0.25, x + 0.2, y, x, y);
    shape.bezierCurveTo(x - 0.3, y, x - 0.3, y + 0.35, x - 0.3, y + 0.35);
    shape.bezierCurveTo(x - 0.3, y + 0.55, x - 0.1, y + 0.77, x + 0.25, y + 0.95);
    shape.bezierCurveTo(x + 0.6, y + 0.77, x + 0.8, y + 0.55, x + 0.8, y + 0.35);
    shape.bezierCurveTo(x + 0.8, y + 0.35, x + 0.8, y, x + 0.5, y);
    shape.bezierCurveTo(x + 0.35, y, x + 0.25, y + 0.25, x + 0.25, y + 0.25);

    const extrudeSettings = {
      steps: 2,
      depth: 0.35,
      bevelEnabled: true,
      bevelThickness: 0.15,
      bevelSize: 0.12,
      bevelOffset: 0,
      bevelSegments: isMobile ? 3 : 6,
    };

    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geo.center();
    // Rotate to face nicely
    geo.rotateZ(Math.PI);
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
