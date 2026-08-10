import React, { useEffect, useRef } from 'react';

export function LenisScrollProvider({ children, onIndexChange, totalIndices = 9 }) {
  const currentIndexRef = useRef(0);
  const isCooldownRef = useRef(false);

  useEffect(() => {
    const handleWheel = (e) => {
      // Direct mouse wheel delta detection
      if (isCooldownRef.current) return;
      
      const delta = e.deltaY;
      if (Math.abs(delta) < 10) return; // Ignore micro-vibrations

      let nextIndex = currentIndexRef.current;
      if (delta > 0) {
        // Scroll DOWN -> Next index
        nextIndex = Math.min(totalIndices - 1, currentIndexRef.current + 1);
      } else if (delta < 0) {
        // Scroll UP -> Previous index
        nextIndex = Math.max(0, currentIndexRef.current - 1);
      }

      if (nextIndex !== currentIndexRef.current) {
        currentIndexRef.current = nextIndex;
        isCooldownRef.current = true;

        if (onIndexChange) {
          onIndexChange(nextIndex);
        }

        // Brief cooldown to prevent aggressive multi-step wheel spins
        setTimeout(() => {
          isCooldownRef.current = false;
        }, 500);
      }
    };

    let touchStartY = 0;

    const handleTouchStart = (e) => {
      if (e.touches.length === 1) {
        touchStartY = e.touches[0].clientY;
      }
    };

    const handleTouchEnd = (e) => {
      if (isCooldownRef.current || !e.changedTouches || e.changedTouches.length !== 1) return;
      const touchEndY = e.changedTouches[0].clientY;
      const diffY = touchStartY - touchEndY;

      if (Math.abs(diffY) > 45) {
        let nextIndex = currentIndexRef.current;
        if (diffY > 0) {
          // Swipe UP -> Next index
          nextIndex = Math.min(totalIndices - 1, currentIndexRef.current + 1);
        } else {
          // Swipe DOWN -> Prev index
          nextIndex = Math.max(0, currentIndexRef.current - 1);
        }

        if (nextIndex !== currentIndexRef.current) {
          currentIndexRef.current = nextIndex;
          isCooldownRef.current = true;

          if (onIndexChange) {
            onIndexChange(nextIndex);
          }

          setTimeout(() => {
            isCooldownRef.current = false;
          }, 450);
        }
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onIndexChange, totalIndices]);

  // Listen to programmatically updated indices (e.g. when clicking a planet)
  useEffect(() => {
    const handleScrollToIndex = (e) => {
      const targetIndex = e.detail?.index;
      if (typeof targetIndex === 'number' && targetIndex >= 0 && targetIndex < totalIndices) {
        currentIndexRef.current = targetIndex;
      }
    };

    window.addEventListener('scrollToPlanetIndex', handleScrollToIndex);
    return () => window.removeEventListener('scrollToPlanetIndex', handleScrollToIndex);
  }, [totalIndices]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>
      {children}
    </div>
  );
}

export function scrollToPlanetIndex(index) {
  window.dispatchEvent(new CustomEvent('scrollToPlanetIndex', { detail: { index } }));
}
