import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { SYSTEM_CONFIG } from '../config';
import {
  ScissorMoonPlanet,
  SculptedHeartPlanet,
  FlowerPlanet,
  RealEarthPlanet,
  SimpleEarthPlanet,
  PhonePlanet,
  TelegramPlanet,
  SupabasePlanet,
  MapboxPlanet,
  PlaywrightPlanet,
  ApifyPlanet,
} from './planets';

  // Central mesh dispatcher mapping shapeIndex/type to dedicated component files
function ProceduralPlanetMesh({ type, color, size, isSelected: _isSelected, isMobile, perfTierFloat }) {
  if (type === 'simple-earth' || type === 'climamedix-simple') {
    return <SimpleEarthPlanet size={size} color={color} isMobile={isMobile} />;
  }
  if (type === 'climamedix' || type === 'real-earth' || type === 'earth-real') {
    return <RealEarthPlanet size={size} isMobile={isMobile} perfTierFloat={perfTierFloat} />;
  }
  if (type === 'flower' || type === 'heart-rivers' || type === 99) {
    return <FlowerPlanet color={color} size={size} isMobile={isMobile} perfTierFloat={perfTierFloat} />;
  }
  if (type === 'heart-sculpted' || type === 100) {
    return <SculptedHeartPlanet color={color} size={size} isMobile={isMobile} perfTierFloat={perfTierFloat} />;
  }
  if (type === 'phone' || type === 'whatsapp') {
    return <PhonePlanet size={size} isMobile={isMobile} perfTierFloat={perfTierFloat} />;
  }
  if (type === 'telegram' || type === 'telegram-bot') {
    return <TelegramPlanet size={size} isMobile={isMobile} perfTierFloat={perfTierFloat} />;
  }
  if (type === 'supabase') {
    return <SupabasePlanet size={size} isMobile={isMobile} perfTierFloat={perfTierFloat} />;
  }
  if (type === 'mapbox' || type === 'mapbox-gis' || type === 'geospatial') {
    return <MapboxPlanet size={size} isMobile={isMobile} perfTierFloat={perfTierFloat} />;
  }
  if (type === 'playwright' || type === 'playwright-e2e' || type === 'e2e-testing') {
    return <PlaywrightPlanet size={size} isMobile={isMobile} perfTierFloat={perfTierFloat} />;
  }
  if (type === 'apify' || type === 'apify-scraper' || type === 'data-radar') {
    return <ApifyPlanet size={size} isMobile={isMobile} perfTierFloat={perfTierFloat} />;
  }
  return <ScissorMoonPlanet color={color} size={size} isMobile={isMobile} perfTierFloat={perfTierFloat} />;
}

// Instant-mount procedural fallback sphere while high-res textures decode
function PlanetFallbackMesh({ color, size }) {
  const planetRadius = (size || 0.5) * 0.85;
  return (
    <mesh>
      <sphereGeometry args={[planetRadius, 20, 20]} />
      <meshStandardMaterial
        color={color || SYSTEM_CONFIG.colors.primaryCyan}
        emissive={color || SYSTEM_CONFIG.colors.primaryCyan}
        emissiveIntensity={0.35}
        roughness={0.6}
        metalness={0.1}
      />
    </mesh>
  );
}

export function PlanetNode({
  project,
  ring,
  onSelect,
  isSelected,
  hasSelection,
  showTitle,
  targetPlanetPosRef,
  targetPlanetQuatRef,
  isMobile,
  isUnlocked = true,
  perfTierFloat = 0.0,
  planetOrientation = { pitch: 0, yaw: 0 },
}) {
  const groupRef = useRef();
  const [hovered, setHovered] = useState(false);
  const [isNearby, setIsNearby] = useState(false);
  const currentScaleRef = useRef(isUnlocked ? 1.0 : 0.0);
  const [shouldRenderMesh, setShouldRenderMesh] = useState(isUnlocked);

  const angleRef = useRef(project.startAngle || 0);

  // Pre-allocate objects to prevent Garbage Collection pauses
  const localPos = useRef(new THREE.Vector3());
  const euler = useRef(new THREE.Euler());
  const worldPos = useRef(new THREE.Vector3());
  const worldQuat = useRef(new THREE.Quaternion());
  const projScreenMatrix = useRef(new THREE.Matrix4());
  const frustum = useRef(new THREE.Frustum());
  const boundingSphereRef = useRef(new THREE.Sphere());

  useFrame((state, delta) => {
    if (!ring) return;

    const safeDelta = Math.min(delta, 0.1);
    angleRef.current += safeDelta * (ring.speed || 0.1);

    const theta = angleRef.current;
    const r = ring.radius;

    localPos.current.set(Math.cos(theta) * r, 0, Math.sin(theta) * r);
    euler.current.set(ring.tiltX || 0, ring.tiltY || 0, ring.tiltZ || 0);
    localPos.current.applyEuler(euler.current);

    // Smooth scale lerp for progressive fade-in
    const targetScale = isUnlocked ? 1.0 : 0.0;
    currentScaleRef.current = THREE.MathUtils.lerp(currentScaleRef.current, targetScale, Math.min(1.0, safeDelta * 5.0));

    if (groupRef.current) {
      groupRef.current.position.copy(localPos.current);
      groupRef.current.scale.setScalar(currentScaleRef.current);

      if (isSelected || showTitle) {
        groupRef.current.getWorldPosition(worldPos.current);
        if (isSelected) {
          if (targetPlanetPosRef) targetPlanetPosRef.current.copy(worldPos.current);
          if (targetPlanetQuatRef) {
            groupRef.current.getWorldQuaternion(worldQuat.current);
            targetPlanetQuatRef.current.copy(worldQuat.current);
          }
        }
        // Distance-gated label: only evaluate when title is active
        const distToCamera = worldPos.current.distanceTo(state.camera.position);
        const nearby = distToCamera < 8.5;
        if (nearby !== isNearby) setIsNearby(nearby);
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
        <React.Suspense fallback={<PlanetFallbackMesh color={planetColor} size={project.size || 0.5} />}>
          <group rotation={[isSelected ? planetOrientation.pitch : 0, isSelected ? planetOrientation.yaw : 0, 0]}>
            <ProceduralPlanetMesh
              type={shapeIndex}
              color={planetColor}
              size={project.size || 0.5}
              isSelected={isSelected}
              isMobile={isMobile}
              perfTierFloat={perfTierFloat}
            />
          </group>
        </React.Suspense>
      )}
      {/* Floating HTML Title Label — only mounted when actually visible */}
      {!hasSelection && isNearby && (hovered || showTitle) && (
        <Html distanceFactor={15} center style={{ pointerEvents: 'none' }}>
          <div className={`planet-label visible pulse`}>
            {project.title}
          </div>
        </Html>
      )}
    </group>
  );
}
