import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * SceneRotator — Incremental Trackball Controller.
 *
 * Solves Euler axis-fighting by applying incremental rotations in screen space.
 * - Drag Horizontal (X) → rotates around World Y (Screen Vertical axis).
 * - Drag Vertical (Y)   → rotates around World X (Screen Horizontal axis).
 *
 * Guarantees intuitive rotation in ALL directions at ALL angles.
 */
export function SceneRotator({ children, disabled = false }) {
  const { gl, size } = useThree();
  const groupRef = useRef();

  // Target orientation quaternion & current display quaternion
  const targetQuaternion = useRef(new THREE.Quaternion());

  // Drag velocity for smooth inertia
  const velocity = useRef({ x: 0, y: 0 });

  // Drag state tracking
  const dragging = useRef(false);
  const lastX = useRef(0);
  const lastY = useRef(0);

  useEffect(() => {
    const canvas = gl.domElement;

    const onPointerDown = (e) => {
      if (disabled) return;
      dragging.current = true;
      lastX.current = e.clientX;
      lastY.current = e.clientY;
      velocity.current = { x: 0, y: 0 };
      canvas.style.cursor = 'grabbing';
    };

    const onPointerMove = (e) => {
      if (!dragging.current || disabled) return;

      const dx = e.clientX - lastX.current;
      const dy = e.clientY - lastY.current;
      lastX.current = e.clientX;
      lastY.current = e.clientY;

      const sensitivity = 2.5;
      // Convert pixel deltas into rotation angles in radians
      const angleX = (dx / size.width) * Math.PI * sensitivity;
      const angleY = (dy / size.height) * Math.PI * sensitivity;

      velocity.current = { x: angleX, y: angleY };

      // Apply immediate incremental rotation to target quaternion
      const qY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), angleX);
      const qX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), angleY);

      // Premultiply applies rotation in WORLD/SCREEN space
      targetQuaternion.current.premultiply(qX).premultiply(qY);
    };

    const onPointerUp = () => {
      dragging.current = false;
      canvas.style.cursor = 'grab';
    };

    const onPointerLeave = () => {
      dragging.current = false;
      canvas.style.cursor = 'grab';
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointerleave', onPointerLeave);
    canvas.style.cursor = 'grab';

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointerleave', onPointerLeave);
    };
  }, [gl, size, disabled]);

  useFrame((_state, delta) => {
    if (!groupRef.current) return;

    // Apply inertia when let go
    if (!dragging.current && (Math.abs(velocity.current.x) > 0.0001 || Math.abs(velocity.current.y) > 0.0001)) {
      const qY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), velocity.current.x);
      const qX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), velocity.current.y);

      targetQuaternion.current.premultiply(qX).premultiply(qY);

      // Friction / damping
      velocity.current.x *= 0.92;
      velocity.current.y *= 0.92;
    }

    // Smoothly slerp current group orientation toward target quaternion
    groupRef.current.quaternion.slerp(targetQuaternion.current, 1 - Math.pow(0.001, delta));
  });

  return <group ref={groupRef}>{children}</group>;
}
