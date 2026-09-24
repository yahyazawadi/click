import React, { useRef, useState, useCallback, useEffect } from 'react';

/**
 * Slim & Minimal Glassmorphic Orientation Sliders
 * - Vertical Slider (Pitch: up/down) on the Left
 * - Horizontal Slider (Yaw: left/right) on the Bottom above the dock
 * - Light blue glowing circular thumbs + rounded rectangular tracks
 * - Double-click track/thumb to snap-reset to 0
 */
export function PlanetOrientationControls({
  orientation = { pitch: 0, yaw: 0 },
  onChange,
  isMobile = false,
  visible = true,
}) {
  if (!visible) return null;

  const verticalTrackRef = useRef(null);
  const horizontalTrackRef = useRef(null);
  const [isDraggingPitch, setIsDraggingPitch] = useState(false);
  const [isDraggingYaw, setIsDraggingYaw] = useState(false);

  // Pitch range: 6 full rotations ([-6π, +6π]) for extended multi-spin control
  const MAX_PITCH = Math.PI * 6;
  // Yaw range: 6 full rotations ([-6π, +6π])
  const MAX_YAW = Math.PI * 6;

  // Normalized percentages [0..1] with center at 0.5 (0 rad)
  const pitchPercent = (orientation.pitch / (MAX_PITCH * 2)) + 0.5;
  const yawPercent = (orientation.yaw / (MAX_YAW * 2)) + 0.5;

  // ── Vertical Slider Pointer Drag (Pitch) ──────────────────────────────────
  const handlePitchPointerDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      e.target.setPointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }
    setIsDraggingPitch(true);
    updatePitchFromPointer(e.clientY);
  };

  const updatePitchFromPointer = useCallback((clientY) => {
    if (!verticalTrackRef.current) return;
    const rect = verticalTrackRef.current.getBoundingClientRect();
    const relativeY = clientY - rect.top;
    const clampedY = Math.max(0, Math.min(rect.height, relativeY));
    // Invert so dragging UP tilts planet UP (positive pitch)
    const norm = 1 - (clampedY / rect.height);
    const newPitch = (norm - 0.5) * (MAX_PITCH * 2);
    onChange((prev) => ({ ...prev, pitch: newPitch }));
  }, [onChange]);

  // ── Horizontal Slider Pointer Drag (Yaw) ──────────────────────────────────
  const handleYawPointerDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      e.target.setPointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }
    setIsDraggingYaw(true);
    updateYawFromPointer(e.clientX);
  };

  const updateYawFromPointer = useCallback((clientX) => {
    if (!horizontalTrackRef.current) return;
    const rect = horizontalTrackRef.current.getBoundingClientRect();
    const relativeX = clientX - rect.left;
    const clampedX = Math.max(0, Math.min(rect.width, relativeX));
    const norm = clampedX / rect.width;
    const newYaw = (norm - 0.5) * (MAX_YAW * 2);
    onChange((prev) => ({ ...prev, yaw: newYaw }));
  }, [onChange]);

  // Global pointer move & up listeners during active drag
  useEffect(() => {
    if (!isDraggingPitch && !isDraggingYaw) return;

    const handlePointerMove = (e) => {
      if (isDraggingPitch) updatePitchFromPointer(e.clientY);
      if (isDraggingYaw) updateYawFromPointer(e.clientX);
    };

    const handlePointerUp = () => {
      setIsDraggingPitch(false);
      setIsDraggingYaw(false);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDraggingPitch, isDraggingYaw, updatePitchFromPointer, updateYawFromPointer]);

  // Snap-reset handlers
  const handleResetPitch = (e) => {
    e.stopPropagation();
    onChange((prev) => ({ ...prev, pitch: 0 }));
  };

  const handleResetYaw = (e) => {
    e.stopPropagation();
    onChange((prev) => ({ ...prev, yaw: 0 }));
  };

  return (
    <>
      {/* ── 1. Vertical Slider (Left Side: Pitch Up/Down) ── */}
      <div
        className="orientation-controls-container"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          left: isMobile ? '14px' : '32px',
          top: isMobile ? '42%' : '46%',
          transform: 'translateY(-50%)',
          zIndex: 35,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          userSelect: 'none',
          pointerEvents: 'auto',
          animation: 'fadeIn 0.3s ease-out',
        }}
      >
        <span
          style={{
            fontSize: '9px',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '1.2px',
            color: 'rgba(64, 200, 255, 0.7)',
            textTransform: 'uppercase',
          }}
        >
          ▲
        </span>

        {/* Vertical Track (Tall Rounded Rectangle) */}
        <div
          ref={verticalTrackRef}
          onPointerDown={handlePitchPointerDown}
          onDoubleClick={handleResetPitch}
          title="Tilt Pitch (Drag to spin multiple times, Double-click to reset)"
          style={{
            width: '6px',
            height: isMobile ? '220px' : 'clamp(340px, 50vh, 500px)',
            borderRadius: '9999px',
            background: 'rgba(6, 18, 34, 0.75)',
            border: '1px solid rgba(0, 186, 227, 0.35)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5), inset 0 0 6px rgba(0, 186, 227, 0.15)',
            backdropFilter: 'blur(10px)',
            position: 'relative',
            cursor: 'ns-resize',
            touchAction: 'none',
          }}
        >
          {/* Light Blue Glowing Circular Thumb */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              bottom: `${Math.max(0, Math.min(1, pitchPercent)) * 100}%`,
              transform: 'translate(-50%, 50%)',
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              background: '#40c8ff',
              boxShadow: '0 0 10px #00bae3, 0 0 2px #ffffff',
              border: '2px solid #ffffff',
              cursor: 'grab',
              transition: isDraggingPitch ? 'none' : 'transform 0.1s ease-out',
            }}
          />
        </div>

        <span
          style={{
            fontSize: '9px',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '1.2px',
            color: 'rgba(64, 200, 255, 0.7)',
            textTransform: 'uppercase',
          }}
        >
          ▼
        </span>
      </div>

      {/* ── 2. Horizontal Slider (Top Header: Yaw Left/Right) ── */}
      <div
        className="orientation-controls-container"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          left: '50%',
          top: isMobile ? '64px' : '28px',
          transform: 'translateX(-50%)',
          zIndex: 35,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          userSelect: 'none',
          pointerEvents: 'auto',
          animation: 'fadeIn 0.3s ease-out',
        }}
      >
        <span
          style={{
            fontSize: '9px',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '1.2px',
            color: 'rgba(64, 200, 255, 0.7)',
            textTransform: 'uppercase',
          }}
        >
          ◄
        </span>

        {/* Horizontal Track (Wide Rounded Rectangle) */}
        <div
          ref={horizontalTrackRef}
          onPointerDown={handleYawPointerDown}
          onDoubleClick={handleResetYaw}
          title="Rotate Yaw (Drag to orient, Double-click to reset)"
          style={{
            width: isMobile ? '220px' : 'clamp(320px, 32vw, 480px)',
            height: '6px',
            borderRadius: '9999px',
            background: 'rgba(6, 18, 34, 0.75)',
            border: '1px solid rgba(0, 186, 227, 0.35)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5), inset 0 0 6px rgba(0, 186, 227, 0.15)',
            backdropFilter: 'blur(10px)',
            position: 'relative',
            cursor: 'ew-resize',
            touchAction: 'none',
          }}
        >
          {/* Light Blue Glowing Circular Thumb */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: `${Math.max(0, Math.min(1, yawPercent)) * 100}%`,
              transform: 'translate(-50%, -50%)',
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              background: '#40c8ff',
              boxShadow: '0 0 10px #00bae3, 0 0 2px #ffffff',
              border: '2px solid #ffffff',
              cursor: 'grab',
              transition: isDraggingYaw ? 'none' : 'transform 0.1s ease-out',
            }}
          />
        </div>

        <span
          style={{
            fontSize: '9px',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '1.2px',
            color: 'rgba(64, 200, 255, 0.7)',
            textTransform: 'uppercase',
          }}
        >
          ►
        </span>
      </div>
    </>
  );
}
