import { useEffect } from 'react';

export function FaviconAnimator() {
  useEffect(() => {
    // Hidden Canvas for rendering favicon frames
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let planetAngle = 0;
    let currentSourceRing = 1;

    // Detect Light Mode vs Dark Mode
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    let isDarkMode = mediaQuery.matches;

    const handleThemeChange = (e) => {
      isDarkMode = e.matches;
    };
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleThemeChange);
    }

    // 4 FPS update interval (250ms per frame)
    const interval = setInterval(() => {
      ctx.clearRect(0, 0, 64, 64);

      // Color Palette mapping for Light Mode vs Dark Mode
      const colors = isDarkMode
        ? {
            atmosphereCore: 'rgba(0, 240, 255, 0.45)',
            atmosphereMid: 'rgba(0, 186, 227, 0.2)',
            ring1: '#00f0ff',
            ring2: '#5dbae1',
            planet1Fill: '#ffffff',
            planet1Shadow: '#00f0ff',
            planet2Fill: '#00f0ff',
            planet2Shadow: '#5dbae1',
            coreRim: 'transparent',
          }
        : {
            atmosphereCore: 'rgba(0, 136, 204, 0.35)',
            atmosphereMid: 'rgba(0, 119, 182, 0.15)',
            ring1: '#00b4d8',
            ring2: '#0077b6',
            planet1Fill: '#00f0ff',
            planet1Shadow: '#0077b6',
            planet2Fill: '#ffffff',
            planet2Shadow: '#00b4d8',
            coreRim: 'rgba(2, 8, 23, 0.35)', // Dark contrast rim so core pops on white tabs!
          };

      // Outer atmosphere glow
      const atmosphereGlow = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
      atmosphereGlow.addColorStop(0, colors.atmosphereCore);
      atmosphereGlow.addColorStop(0.5, colors.atmosphereMid);
      atmosphereGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = atmosphereGlow;
      ctx.beginPath();
      ctx.arc(32, 32, 30, 0, Math.PI * 2);
      ctx.fill();

      // Light Mode Rim Shadow Base for white browser tabs
      if (!isDarkMode) {
        ctx.fillStyle = colors.coreRim;
        ctx.beginPath();
        ctx.arc(32, 32, 16.5, 0, Math.PI * 2);
        ctx.fill();
      }

      const rad35 = (35 * Math.PI) / 180;
      const radNeg15 = (-15 * Math.PI) / 180;

      // ==========================================
      // 1. FIXED BACK ARCS (BEHIND CORE)
      // ==========================================
      
      // Ring 2 Back Arc
      ctx.save();
      ctx.translate(32, 32);
      ctx.rotate(rad35);
      ctx.strokeStyle = colors.ring2;
      ctx.lineWidth = 2.2;
      ctx.globalAlpha = isDarkMode ? 0.6 : 0.75;
      ctx.beginPath();
      ctx.ellipse(0, 0, 27, 11, 0, Math.PI, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Ring 1 Back Arc
      ctx.save();
      ctx.translate(32, 32);
      ctx.rotate(radNeg15);
      ctx.strokeStyle = colors.ring1;
      ctx.lineWidth = 2.5;
      ctx.globalAlpha = isDarkMode ? 0.65 : 0.8;
      ctx.beginPath();
      ctx.ellipse(0, 0, 22, 8.5, 0, Math.PI, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Normalize angle to [0, 2*PI)
      const normAngle = ((planetAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      const isBehindCore = normAngle > Math.PI;

      const targetRing = currentSourceRing === 1 ? 2 : 1;

      // Calculate Ring 1 Position at normAngle
      const r1x = 22 * Math.cos(normAngle);
      const r1y = 8.5 * Math.sin(normAngle);
      const px1 = 32 + r1x * Math.cos(radNeg15) - r1y * Math.sin(radNeg15);
      const py1 = 32 + r1x * Math.sin(radNeg15) + r1y * Math.cos(radNeg15);

      // Calculate Ring 2 Position at normAngle
      const r2x = 27 * Math.cos(normAngle);
      const r2y = 11 * Math.sin(normAngle);
      const px2 = 32 + r2x * Math.cos(rad35) - r2y * Math.sin(rad35);
      const py2 = 32 + r2x * Math.sin(rad35) + r2y * Math.cos(rad35);

      let px = 0;
      let py = 0;
      let activeColorRing = currentSourceRing;

      if (!isBehindCore) {
        if (currentSourceRing === 1) {
          px = px1; py = py1;
        } else {
          px = px2; py = py2;
        }
      } else {
        const t = (normAngle - Math.PI) / Math.PI;
        const blend = (1 - Math.cos(t * Math.PI)) / 2;

        const startPx = currentSourceRing === 1 ? px1 : px2;
        const startPy = currentSourceRing === 1 ? py1 : py2;
        const endPx = currentSourceRing === 1 ? px2 : px1;
        const endPy = currentSourceRing === 1 ? py2 : py1;

        px = (1 - blend) * startPx + blend * endPx;
        py = (1 - blend) * startPy + blend * endPy;

        activeColorRing = blend < 0.5 ? currentSourceRing : targetRing;

        if (t > 0.95) {
          currentSourceRing = targetRing;
        }
      }

      // Render function for the single planet
      const drawPlanet = () => {
        ctx.fillStyle = activeColorRing === 1 ? colors.planet1Fill : colors.planet2Fill;
        ctx.shadowColor = activeColorRing === 1 ? colors.planet1Shadow : colors.planet2Shadow;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(px, py, 4.0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      };

      // ==========================================
      // 2. LAYER 2: PLANET BEHIND CORE (IF BEHIND)
      // ==========================================
      if (isBehindCore) {
        drawPlanet();
      }

      // ==========================================
      // 3. CENTRAL PLANET CORE (STATIONARY SPHERE)
      // ==========================================
      ctx.save();
      ctx.translate(32, 32);
      
      // Core base sphere gradient
      const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 13.5);
      if (isDarkMode) {
        coreGrad.addColorStop(0, '#ffffff');
        coreGrad.addColorStop(0.25, '#00f0ff');
        coreGrad.addColorStop(0.6, '#00bae3');
        coreGrad.addColorStop(0.85, '#003268');
        coreGrad.addColorStop(1, '#00122e');
      } else {
        coreGrad.addColorStop(0, '#ffffff');
        coreGrad.addColorStop(0.25, '#00f0ff');
        coreGrad.addColorStop(0.6, '#0088cc');
        coreGrad.addColorStop(0.9, '#003366');
        coreGrad.addColorStop(1, '#00122e');
      }
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 13.5, 0, Math.PI * 2);
      ctx.fill();

      // Core surface details
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.85;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.arc(0, 0, 8.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // 4 Core Surface Orbs
      const orbDist = 8.5;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(0, -orbDist, 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(0, orbDist, 2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#00f0ff';
      ctx.beginPath(); ctx.arc(-orbDist, 0, 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(orbDist, 0, 2, 0, Math.PI * 2); ctx.fill();

      // Core center emblem cross
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.8;
      ctx.globalAlpha = 0.95;
      ctx.beginPath();
      ctx.moveTo(-4, 0); ctx.lineTo(4, 0);
      ctx.moveTo(0, -4); ctx.lineTo(0, 4);
      ctx.stroke();

      ctx.restore();

      // ==========================================
      // 4. FIXED FRONT ARCS (IN FRONT OF CORE)
      // ==========================================

      // Ring 2 Front Arc
      ctx.save();
      ctx.translate(32, 32);
      ctx.rotate(rad35);
      ctx.strokeStyle = colors.ring2;
      ctx.lineWidth = 2.2;
      ctx.globalAlpha = isDarkMode ? 0.85 : 0.95;
      ctx.beginPath();
      ctx.ellipse(0, 0, 27, 11, 0, 0, Math.PI);
      ctx.stroke();
      ctx.restore();

      // Ring 1 Front Arc
      ctx.save();
      ctx.translate(32, 32);
      ctx.rotate(radNeg15);
      ctx.strokeStyle = colors.ring1;
      ctx.lineWidth = 2.5;
      ctx.globalAlpha = isDarkMode ? 0.95 : 1.0;
      ctx.beginPath();
      ctx.ellipse(0, 0, 22, 8.5, 0, 0, Math.PI);
      ctx.stroke();
      ctx.restore();

      // ==========================================
      // 5. LAYER 5: PLANET IN FRONT OF CORE (IF IN FRONT)
      // ==========================================
      if (!isBehindCore) {
        drawPlanet();
      }

      // Advance planet angle along the orbit
      planetAngle += 0.22;

      const dataUrl = canvas.toDataURL('image/png');
      
      let faviconLink = document.getElementById('dynamic-favicon');
      if (!faviconLink) {
        const existingLinks = document.querySelectorAll("link[rel*='icon']");
        existingLinks.forEach((el) => el.remove());
        faviconLink = document.createElement('link');
        faviconLink.id = 'dynamic-favicon';
        faviconLink.rel = 'icon';
        faviconLink.type = 'image/png';
        document.head.appendChild(faviconLink);
      }
      faviconLink.href = dataUrl;

    }, 250); // 4 FPS

    return () => {
      clearInterval(interval);
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleThemeChange);
      }
    };
  }, []);

  return null;
}
