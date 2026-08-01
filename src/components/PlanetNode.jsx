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
  NodePlanet,
} from './planets';

// Central mesh dispatcher mapping shapeIndex to dedicated component files
function ProceduralPlanetMesh({ type, color, size }) {
  const nodeType = typeof type === 'number' ? Math.abs(type) % 10 : 0;

  switch (nodeType) {
    case 0:
      return <ScissorPlanet color={color} size={size} />;
    case 1:
      return <SaturnPlanet color={color} size={size} />;
    case 2:
      return <MobiusPlanet color={color} size={size} />;
    case 3:
      return <CrystalPlanet color={color} size={size} />;
    case 4:
      return <GyroscopePlanet color={color} size={size} />;
    case 5:
      return <PlasmaTorusPlanet color={color} size={size} />;
    case 6:
      return <VortexShellPlanet color={color} size={size} />;
    case 7:
      return <HyperCubePlanet color={color} size={size} />;
    case 8:
      return <BinaryMoonPlanet color={color} size={size} />;
    case 9:
    default:
      return <NodePlanet color={color} size={size} />;
  }
}

export function PlanetNode({ project, ring, onSelect, isSelected, hasSelection, showTitle, onUpdatePosition }) {
  const groupRef = useRef();
  const [hovered, setHovered] = useState(false);

  const angleRef = useRef(project.startAngle || 0);

  useFrame((state, delta) => {
    if (!ring) return;

    angleRef.current += delta * (ring.speed || 0.1);

    const theta = angleRef.current;
    const r = ring.radius;

    const localPos = new THREE.Vector3(Math.cos(theta) * r, 0, Math.sin(theta) * r);
    const euler = new THREE.Euler(ring.tiltX || 0, ring.tiltY || 0, ring.tiltZ || 0);
    localPos.applyEuler(euler);

    if (groupRef.current) {
      groupRef.current.position.copy(localPos);

      if (isSelected && onUpdatePosition) {
        const worldPos = new THREE.Vector3();
        groupRef.current.getWorldPosition(worldPos);
        onUpdatePosition(worldPos);
      }
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
        onSelect(project.id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
      }}
    >
      <ProceduralPlanetMesh
        type={shapeIndex}
        color={planetColor}
        size={project.size || 0.5}
      />

      {/* Floating HTML Title Label */}
      {!hasSelection && (
        <Html distanceFactor={15} center style={{ pointerEvents: 'none' }}>
          <div className={`planet-label ${hovered || showTitle ? 'visible pulse' : ''}`}>
            {project.title}
          </div>
        </Html>
      )}
    </group>
  );
}
