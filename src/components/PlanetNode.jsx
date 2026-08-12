import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { SYSTEM_CONFIG } from '../config';
import {
  ScissorPlanet,
  ScissorMoonPlanet,
} from './planets';

  // Central mesh dispatcher mapping shapeIndex to dedicated component files
function ProceduralPlanetMesh({ type, color, size, isSelected, isMobile, perfTierFloat }) {
  // Always return ScissorMoonPlanet as per user request
  return <ScissorMoonPlanet color={color} size={size} isMobile={isMobile} perfTierFloat={perfTierFloat} />;
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
  const projScreenMatrix = useRef(new THREE.Matrix4());
  const frustum = useRef(new THREE.Frustum());
  const boundingSphereRef = useRef(new THREE.Sphere());

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

      // Frustum Culling / Viewport Check: Skip rendering when planet is offscreen
      groupRef.current.getWorldPosition(worldPos.current);
      projScreenMatrix.current.multiplyMatrices(state.camera.projectionMatrix, state.camera.matrixWorldInverse);
      frustum.current.setFromProjectionMatrix(projScreenMatrix.current);
      // Sphere radius check (size + margin) - zero allocation
      const boundingRadius = (project.size || 0.5) * 2.5;
      boundingSphereRef.current.set(worldPos.current, boundingRadius);
      const isVisibleInFrustum = frustum.current.intersectsSphere(boundingSphereRef.current);
      groupRef.current.visible = isVisibleInFrustum;
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
