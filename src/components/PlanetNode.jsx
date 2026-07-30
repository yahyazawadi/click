import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { SYSTEM_CONFIG } from '../config';

// ----------------------------------------------------
// PROCEDURAL 3D PLANET MODEL RENDERER
// ----------------------------------------------------
function ProceduralPlanetMesh({ type, color, size }) {
  const meshRef = useRef();
  const outerRingRef = useRef();
  const cageRef = useRef();

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.4;
      meshRef.current.rotation.x += delta * 0.1;
    }
    if (outerRingRef.current) {
      outerRingRef.current.rotation.z += delta * 0.6;
    }
    if (cageRef.current) {
      cageRef.current.rotation.y -= delta * 0.3;
      cageRef.current.rotation.z += delta * 0.2;
    }
  });

  // Type 0: Saturn-Style Ringed Planet
  if (type === 0 || type === 'ringed') {
    return (
      <group>
        <mesh ref={meshRef}>
          <sphereGeometry args={[size, 32, 32]} />
          <meshStandardMaterial
            color={color}
            roughness={0.3}
            metalness={0.7}
            emissive={color}
            emissiveIntensity={0.3}
          />
        </mesh>
        <mesh ref={outerRingRef} rotation={[Math.PI / 3, 0, 0]}>
          <ringGeometry args={[size * 1.3, size * 1.8, 48]} />
          <meshStandardMaterial
            color={SYSTEM_CONFIG.colors.primaryCyan}
            side={THREE.DoubleSide}
            transparent
            opacity={0.7}
            roughness={0.2}
          />
        </mesh>
      </group>
    );
  }

  // Type 1: Geodesic Wireframe Lattice Cage Orb
  if (type === 1 || type === 'lattice') {
    return (
      <group>
        <mesh ref={meshRef}>
          <sphereGeometry args={[size * 0.75, 24, 24]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.6}
            roughness={0.2}
          />
        </mesh>
        <mesh ref={cageRef}>
          <icosahedronGeometry args={[size * 1.25, 1]} />
          <meshStandardMaterial
            color={SYSTEM_CONFIG.colors.textPure}
            wireframe
            transparent
            opacity={0.8}
          />
        </mesh>
      </group>
    );
  }

  // Type 2: Crystal Polyhedron / Diamond Gem
  if (type === 2 || type === 'crystal') {
    return (
      <group>
        <mesh ref={meshRef}>
          <octahedronGeometry args={[size * 1.1, 0]} />
          <meshStandardMaterial
            color={color}
            roughness={0.1}
            metalness={0.9}
            flatShading
            emissive={color}
            emissiveIntensity={0.3}
          />
        </mesh>
      </group>
    );
  }

  // Default / Type 3: Binary Moon Cluster
  return (
    <group>
      <mesh ref={meshRef}>
        <dodecahedronGeometry args={[size, 1]} />
        <meshStandardMaterial
          color={color}
          roughness={0.4}
          metalness={0.6}
          flatShading
          emissive={color}
          emissiveIntensity={0.2}
        />
      </mesh>
      <mesh ref={outerRingRef} position={[size * 1.6, 0, 0]}>
        <sphereGeometry args={[size * 0.3, 16, 16]} />
        <meshStandardMaterial color={SYSTEM_CONFIG.colors.primaryCyan} emissive={SYSTEM_CONFIG.colors.primaryCyan} emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

export function PlanetNode({ project, ring, onSelect, isSelected, hasSelection, showTitle, onUpdatePosition }) {
  const groupRef = useRef();
  const [hovered, setHovered] = useState(false);

  const angleRef = useRef(project.startAngle || 0);

  useFrame((state, delta) => {
    if (!ring) return;

    // Always continue orbiting, even when selected!
    angleRef.current += delta * (ring.speed || 0.1);

    const theta = angleRef.current;
    const r = ring.radius;

    const localPos = new THREE.Vector3(Math.cos(theta) * r, 0, Math.sin(theta) * r);
    const euler = new THREE.Euler(ring.tiltX || 0, ring.tiltY || 0, ring.tiltZ || 0);
    localPos.applyEuler(euler);

    if (groupRef.current) {
      groupRef.current.position.copy(localPos);

      // Report dynamic WORLD position to parent for camera tracking
      if (isSelected && onUpdatePosition) {
        const worldPos = new THREE.Vector3();
        groupRef.current.getWorldPosition(worldPos);
        onUpdatePosition(worldPos);
      }
    }
  });

  const planetType = project.ringIndex % 4;
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
        type={planetType}
        color={planetColor}
        size={project.size || 0.5}
      />

      {/* Floating HTML Title Label (Hidden when any planet is focused) */}
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
