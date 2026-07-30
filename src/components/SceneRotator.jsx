import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * SceneRotator — replaces PresentationControls.
 *
 * Instead of applying Euler deltas in body space (which fights itself after
 * any rotation), we store the scene's orientation as two spherical angles
 * (azimuth θ and polar φ) in WORLD space, then build a clean quaternion each
 * frame.  Drag right → scene turns right.  Drag down → scene tilts down. ✓
 */
export function SceneRotator({ children, disabled = false }) {
  const { gl, size } = useThree();
  const groupRef = useRef();

  // Spherical orbit angles (world-space, never accumulate Euler gimbal)
  const azimuth = useRef(0);   // horizontal — Y axis
  const polar   = useRef(0);   // vertical   — X axis

  // Smooth display values (lerped toward the target)
  const displayAz = useRef(0);
  const displayPol = useRef(0);

  // Drag state
  const dragging  = useRef(false);
  const lastX     = useRef(0);
  const lastY     = useRef(0);

  useEffect(() => {
    const canvas = gl.domElement;

    const onPointerDown = (e) => {
      if (disabled) return;
      dragging.current = true;
      lastX.current = e.clientX;
      lastY.current = e.clientY;
      canvas.style.cursor = 'grabbing';
    };

    const onPointerMove = (e) => {
      if (!dragging.current || disabled) return;

      const dx = e.clientX - lastX.current;
      const dy = e.clientY - lastY.current;
      lastX.current = e.clientX;
      lastY.current = e.clientY;

      // Map pixel deltas → radians
      // Divide by viewport so speed is viewport-independent
      const sensitivity = 2.5;
      // Drag RIGHT  → azimuth increases (scene rotates right visually)   ← fixed direction
      // Drag DOWN   → polar increases (scene tilts down visually)         ← fixed direction
      azimuth.current += (dx / size.width)  * Math.PI * sensitivity;
      polar.current   += (dy / size.height) * Math.PI * sensitivity;

      // Clamp polar so we never flip upside down completely
      polar.current = THREE.MathUtils.clamp(polar.current, -Math.PI * 0.48, Math.PI * 0.48);
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

    // Smooth lerp display angles toward target
    const lerpFactor = 1 - Math.pow(0.02, delta);
    displayAz.current  += (azimuth.current  - displayAz.current)  * lerpFactor;
    displayPol.current += (polar.current    - displayPol.current) * lerpFactor;

    // Build rotation from two independent world-space angles.
    // Y-axis rotation first (azimuth), then X-axis (polar).
    // This is effectively a "turntable" rotation — no gimbal lock.
    const qY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), displayAz.current);
    const qX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), displayPol.current);
    groupRef.current.quaternion.copy(qY).multiply(qX);
  });

  return <group ref={groupRef}>{children}</group>;
}
