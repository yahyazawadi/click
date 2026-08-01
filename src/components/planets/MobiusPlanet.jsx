import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function MobiusPlanet({ color, size }) {
  const meshRef = useRef();
  const innerRef = useRef();
  const cageRef = useRef();

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.4;
      meshRef.current.rotation.x += delta * 0.15;
    }
    if (innerRef.current) {
      innerRef.current.rotation.y -= delta * 0.7;
    }
    if (cageRef.current) {
      cageRef.current.rotation.y += delta * 0.3;
      cageRef.current.rotation.z += delta * 0.2;
    }
  });

  const mobiusGeometry = React.useMemo(() => {
    const uSegments = 120;
    const vSegments = 20;
    const positions = [];
    const normals = [];
    const uvs = [];
    const indices = [];

    const R = size * 0.95;
    const w = size * 0.45;

    for (let i = 0; i <= uSegments; i++) {
      const u = (i / uSegments) * Math.PI * 2;
      for (let j = 0; j <= vSegments; j++) {
        const v = (j / vSegments - 0.5) * w;

        const x = (R + v * Math.cos(u / 2)) * Math.cos(u);
        const y = (R + v * Math.cos(u / 2)) * Math.sin(u);
        const z = v * Math.sin(u / 2);

        positions.push(x, y, z);
        uvs.push(i / uSegments, j / vSegments);

        const nx = Math.cos(u) * Math.cos(u / 2);
        const ny = Math.sin(u) * Math.cos(u / 2);
        const nz = Math.sin(u / 2);
        normals.push(nx, ny, nz);
      }
    }

    for (let i = 0; i < uSegments; i++) {
      for (let j = 0; j < vSegments; j++) {
        const a = i * (vSegments + 1) + j;
        const b = (i + 1) * (vSegments + 1) + j;
        const c = (i + 1) * (vSegments + 1) + (j + 1);
        const d = i * (vSegments + 1) + (j + 1);

        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geom.setIndex(indices);
    geom.computeVertexNormals();
    return geom;
  }, [size]);

  // Clean up geometry from GPU memory on unmount
  useEffect(() => {
    return () => mobiusGeometry.dispose();
  }, [mobiusGeometry]);

  return (
    <group>
      <mesh ref={innerRef}>
        <sphereGeometry args={[size * 0.38, 24, 24]} />
        <meshStandardMaterial
          color="#FCFCFC"
          emissive="#00BAE3"
          emissiveIntensity={1.2}
          roughness={0.1}
        />
      </mesh>
      <mesh ref={meshRef} geometry={mobiusGeometry}>
        <meshStandardMaterial
          color="#00BAE3"
          emissive="#003268"
          emissiveIntensity={0.6}
          side={THREE.DoubleSide}
          roughness={0.15}
          metalness={0.85}
        />
      </mesh>
      <mesh ref={cageRef} geometry={mobiusGeometry} scale={[1.04, 1.04, 1.04]}>
        <meshStandardMaterial
          color="#FCFCFC"
          emissive="#00BAE3"
          emissiveIntensity={0.9}
          wireframe
          side={THREE.DoubleSide}
          transparent
          opacity={0.7}
        />
      </mesh>
    </group>
  );
}
