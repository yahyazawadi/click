import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function ScissorPlanet({ color, size }) {
  const meshRef = useRef();
  const blade1Ref = useRef();
  const blade2Ref = useRef();
  const innerRef = useRef();

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.4;
      meshRef.current.rotation.x += delta * 0.25;
      meshRef.current.rotation.z += delta * 0.15;
    }
    
    // Snapping cut angle ranging from 0.08 (open wide) to 0.32
    const cutAngle = Math.sin(t * 3.0) * 0.12 + 0.20;
    if (blade1Ref.current) {
      blade1Ref.current.rotation.z = cutAngle;
    }
    if (blade2Ref.current) {
      blade2Ref.current.rotation.z = -cutAngle;
    }
  });

  const bladeLen = size * 2.0;

  // Custom sharp tapered blade tip shape geometry
  const sharpBladeGeometry = React.useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, -size * 0.06);
    shape.lineTo(bladeLen * 0.8, -size * 0.04);
    shape.lineTo(bladeLen, 0); // Razor sharp pointed tip
    shape.lineTo(bladeLen * 0.7, size * 0.1);
    shape.lineTo(0, size * 0.12);
    shape.closePath();

    const extrudeSettings = {
      steps: 1,
      depth: size * 0.05,
      bevelEnabled: true,
      bevelThickness: size * 0.015,
      bevelSize: size * 0.01,
      bevelSegments: 3,
    };

    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }, [bladeLen, size]);

  return (
    <group ref={meshRef} rotation={[Math.PI / 4, Math.PI / 6, 0]}>
      {/* Central Spherical Pivot Bolt */}
      <mesh ref={innerRef}>
        <sphereGeometry args={[size * 0.28, 32, 32]} />
        <meshStandardMaterial
          color="#001F3F"
          emissive="#00BAE3"
          emissiveIntensity={0.6}
          roughness={0.1}
          metalness={0.95}
        />
      </mesh>

      {/* Outer Raised Pivot Cap Ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[size * 0.35, size * 0.35, size * 0.15, 32]} />
        <meshStandardMaterial
          color="#00152B"
          metalness={0.9}
          roughness={0.1}
          emissive="#003268"
          emissiveIntensity={0.4}
        />
      </mesh>

      {/* UPPER SHARP 3D SHEAR BLADE & MOULDED HANDLE (Z-Plane Offset: +size * 0.04) */}
      <group ref={blade1Ref}>
        {/* Tapered Razor Sharp 3D Blade Mesh */}
        <mesh geometry={sharpBladeGeometry} position={[size * 0.15, 0, size * 0.02]}>
          <meshStandardMaterial
            color="#E6F7FF"
            metalness={0.98}
            roughness={0.05}
            emissive="#00BAE3"
            emissiveIntensity={0.35}
          />
        </mesh>

        {/* Razor Edge White Glowing Edge Highlight */}
        <mesh position={[bladeLen * 0.55, -size * 0.05, size * 0.05]} rotation={[0, 0, -Math.PI / 36]}>
          <boxGeometry args={[bladeLen * 0.85, size * 0.02, size * 0.05]} />
          <meshStandardMaterial
            color="#FCFCFC"
            emissive="#FCFCFC"
            emissiveIntensity={1.3}
          />
        </mesh>

        {/* Upper Straight Handle Shank */}
        <mesh position={[-bladeLen * 0.22, 0, size * 0.04]}>
          <boxGeometry args={[bladeLen * 0.45, size * 0.14, size * 0.08]} />
          <meshStandardMaterial
            color="#00152B"
            metalness={0.8}
            roughness={0.2}
            emissive="#002244"
            emissiveIntensity={0.3}
          />
        </mesh>

        {/* Dark Blue Handle Finger Loop (Centered along handle axis Y = 0) */}
        <group position={[-bladeLen * 0.45, 0, size * 0.05]}>
          <mesh>
            <torusGeometry args={[size * 0.36, size * 0.1, 24, 48]} />
            <meshStandardMaterial
              color="#00152B"
              emissive="#002244"
              emissiveIntensity={0.4}
              metalness={0.8}
              roughness={0.2}
            />
          </mesh>
          <mesh>
            <torusGeometry args={[size * 0.36, size * 0.025, 16, 32]} />
            <meshStandardMaterial
              color="#005580"
              emissive="#00BAE3"
              emissiveIntensity={0.6}
            />
          </mesh>
        </group>
      </group>

      {/* LOWER SHARP 3D SHEAR BLADE & MOULDED HANDLE (Z-Plane Offset: -size * 0.05) */}
      <group ref={blade2Ref}>
        {/* Tapered Razor Sharp 3D Blade Mesh (Flipped) */}
        <mesh
          geometry={sharpBladeGeometry}
          position={[size * 0.15, 0, -size * 0.07]}
          rotation={[Math.PI, 0, 0]}
        >
          <meshStandardMaterial
            color="#E6F7FF"
            metalness={0.98}
            roughness={0.05}
            emissive="#00BAE3"
            emissiveIntensity={0.35}
          />
        </mesh>

        {/* Razor Edge White Glowing Edge Highlight */}
        <mesh position={[bladeLen * 0.55, size * 0.05, -size * 0.05]} rotation={[0, 0, Math.PI / 36]}>
          <boxGeometry args={[bladeLen * 0.85, size * 0.02, size * 0.05]} />
          <meshStandardMaterial
            color="#FCFCFC"
            emissive="#FCFCFC"
            emissiveIntensity={1.3}
          />
        </mesh>

        {/* Lower Straight Handle Shank */}
        <mesh position={[-bladeLen * 0.22, 0, -size * 0.04]}>
          <boxGeometry args={[bladeLen * 0.45, size * 0.14, size * 0.08]} />
          <meshStandardMaterial
            color="#00152B"
            metalness={0.8}
            roughness={0.2}
            emissive="#002244"
            emissiveIntensity={0.3}
          />
        </mesh>

        {/* Dark Blue Handle Finger Loop (Centered along handle axis Y = 0) */}
        <group position={[-bladeLen * 0.45, 0, -size * 0.05]}>
          <mesh>
            <torusGeometry args={[size * 0.36, size * 0.1, 24, 48]} />
            <meshStandardMaterial
              color="#00152B"
              emissive="#002244"
              emissiveIntensity={0.4}
              metalness={0.8}
              roughness={0.2}
            />
          </mesh>
          <mesh>
            <torusGeometry args={[size * 0.36, size * 0.025, 16, 32]} />
            <meshStandardMaterial
              color="#005580"
              emissive="#00BAE3"
              emissiveIntensity={0.6}
            />
          </mesh>
        </group>
      </group>
    </group>
  );
}
