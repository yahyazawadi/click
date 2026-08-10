import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { SYSTEM_CONFIG } from '../config';
import {
  SaturnPlanet,
  MobiusPlanet,
  CrystalPlanet,
  GyroscopePlanet,
  PlasmaTorusPlanet,
  VortexShellPlanet,
  HyperCubePlanet,
  BinaryMoonPlanet,
  ScissorPlanet,
  ScissorMoonPlanet,
  NodePlanet,
} from './planets';

  // Central mesh dispatcher mapping shapeIndex to dedicated component files
function ProceduralPlanetMesh({ type, color, size, isSelected, isMobile, perfTierFloat }) {
  const nodeType = typeof type === 'number' ? Math.abs(type) % 11 : 0;

  switch (nodeType) {
    case 0:
      return <PlasmaTorusPlanet color={color} size={size} isMobile={isMobile} />;
    case 1:
      return <SaturnPlanet color={color} size={size} isMobile={isMobile} />;
    case 2:
      return <MobiusPlanet color={color} size={size} isMobile={isMobile} />;
    case 3:
      return <CrystalPlanet color={color} size={size} isMobile={isMobile} />;
    case 4:
      return <GyroscopePlanet color={color} size={size} isMobile={isMobile} />;
    case 5:
      return <PlasmaTorusPlanet color={color} size={size} isMobile={isMobile} />;
    case 6:
      return <VortexShellPlanet color={color} size={size} isMobile={isMobile} />;
    case 7:
      return <HyperCubePlanet color={color} size={size} isMobile={isMobile} />;
    case 8:
      return <BinaryMoonPlanet color={color} size={size} isMobile={isMobile} />;
    case 9:
      return <NodePlanet color={color} size={size} isFocused={isSelected} isMobile={isMobile} />;
    case 10:
      return <ScissorMoonPlanet color={color} size={size} isMobile={isMobile} perfTierFloat={perfTierFloat} />;
    default:
      return <NodePlanet color={color} size={size} isFocused={isSelected} isMobile={isMobile} />;
  }
}

export function PlanetNode({ project, ring, onSelect, isSelected, hasSelection, showTitle, targetPlanetPosRef, isMobile, isUnlocked = true, perfTierFloat = 0.0 }) {
  const groupRef = useRef();
  const [hovered, setHovered] = useState(false);
  const currentScaleRef = useRef(isUnlocked ? 1.0 : 0.0);
  const [shouldRenderMesh, setShouldRenderMesh] = useState(isUnlocked);

  const angleRef = useRef(project.startAngle || 0);

  // Pre-allocate objects to prevent Garbage Collection pauses
  const localPos = useRef(new THREE.Vector3());
  const euler = useRef(new THREE.Euler());
  const worldPos = useRef(new THREE.Vector3());

  useFrame((state, delta) => {
    if (!ring) return;

    angleRef.current += delta * (ring.speed || 0.1);

    const theta = angleRef.current;
    const r = ring.radius;

    localPos.current.set(Math.cos(theta) * r, 0, Math.sin(theta) * r);
    euler.current.set(ring.tiltX || 0, ring.tiltY || 0, ring.tiltZ || 0);
    localPos.current.applyEuler(euler.current);

    // Smooth scale lerp for progressive fade-in
    const targetScale = isUnlocked ? 1.0 : 0.0;
    currentScaleRef.current = THREE.MathUtils.lerp(currentScaleRef.current, targetScale, Math.min(1.0, delta * 5.0));

    if (groupRef.current) {
      groupRef.current.position.copy(localPos.current);
      groupRef.current.scale.setScalar(currentScaleRef.current);

      if (isSelected && targetPlanetPosRef) {
        groupRef.current.getWorldPosition(worldPos.current);
        targetPlanetPosRef.current.copy(worldPos.current);
      }
    }

    if (currentScaleRef.current > 0.02 && !shouldRenderMesh) {
      setShouldRenderMesh(true);
    } else if (currentScaleRef.current <= 0.01 && shouldRenderMesh && !isUnlocked) {
      setShouldRenderMesh(false);
    }
  });

  const shapeIndex = project.shapeIndex !== undefined 
    ? project.shapeIndex 
    : (project.ringIndex * 3 + Math.floor((project.startAngle || 0) * 2)) % 8;
  const planetColor = project.color || SYSTEM_CONFIG.colors.primaryCyan;

  return (
    <group
      ref={groupRef}
      onClick={(e) => {
        e.stopPropagation();
        if (isUnlocked) onSelect(project.id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        if (isUnlocked) setHovered(true);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
      }}
    >
      {shouldRenderMesh && (
        <ProceduralPlanetMesh
          type={shapeIndex}
          color={planetColor}
          size={project.size || 0.5}
          isSelected={isSelected}
          isMobile={isMobile}
          perfTierFloat={perfTierFloat}
        />
      )}
      {/* Floating HTML Title Label — only mounted when actually visible */}
      {!hasSelection && (hovered || showTitle) && (
        <Html distanceFactor={15} center style={{ pointerEvents: 'none' }}>
          <div className={`planet-label visible pulse`}>
            {project.title}
          </div>
        </Html>
      )}
    </group>
  );
}
