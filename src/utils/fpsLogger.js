/**
 * YAHYA.CLICK — COMPREHENSIVE FPS TELEMETRY & USER INTERACTION LOGGER
 * Continuously records frame timing, 1% lows, GPU tier, memory, battery, hardware telemetry,
 * USER INTERACTION EVENTS (clicks, planet focus, drags, scroll, resize), CAMERA TRAJECTORIES,
 * AUTOMATIC STUTTER CATEGORIZATION (GC Sweeps, Shader Compilation, Fill-rate Overload),
 * STUTTER SEVERITY (MINOR, MODERATE, SEVERE, CRITICAL), TAB VISIBILITY,
 * and WEBGL RENDER METRICS (Draw calls, Triangles).
 * Supports 1-click JSON and CSV export.
 */

class FPSLogger {
  constructor() {
    this.logs = [];
    this.stutterEvents = [];
    this.tierChangeEvents = [];
    this.userInteractions = [];
    this.unlockEvents = [];
    this.maxLogs = 600; // 10 minutes at 1 snapshot/sec
    this.startTime = Date.now();
    this.sessionInfo = this.getDeviceInfo();
    this.isRecording = true;
    this.lastMemoryMB = null;
    
    // Global reference for debugging in devtools console
    if (typeof window !== 'undefined') {
      window.__FPS_LOGGER__ = this;

      // Track window resizes as interaction events
      let resizeTimer = null;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          this.logInteraction({
            type: 'WINDOW_RESIZE',
            target: 'VIEWPORT',
            details: { width: window.innerWidth, height: window.innerHeight }
          });
        }, 300);
      });
    }
  }

  getDeviceInfo() {
    if (typeof window === 'undefined') return {};
    const ua = navigator.userAgent;
    let browser = 'Unknown';
    if (ua.includes('Firefox/')) browser = 'Firefox';
    else if (ua.includes('Edg/')) browser = 'Edge';
    else if (ua.includes('Chrome/')) browser = 'Chrome';
    else if (ua.includes('Safari/')) browser = 'Safari';

    let gpuRenderer = 'Unknown';
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          gpuRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        }
      }
    } catch (e) {
      gpuRenderer = 'Error querying GPU';
    }

    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const networkInfo = conn ? {
      effectiveType: conn.effectiveType || 'unknown',
      rttMs: conn.rtt || 'unknown',
      downlinkMbps: conn.downlink || 'unknown',
    } : { online: navigator.onLine };

    return {
      commitHash: typeof __COMMIT_HASH__ !== 'undefined' ? __COMMIT_HASH__ : 'unknown',
      userAgent: ua,
      browser,
      gpuRenderer,
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio || 1,
      hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
      touchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      network: networkInfo,
      startTimeISO: new Date().toISOString(),
    };
  }

  // Record user interactions (clicks, focus, drag, navigation, resize)
  logInteraction({ type, target, details }) {
    if (!this.isRecording) return;
    const evt = {
      event: 'USER_INTERACTION',
      timestamp: Date.now(),
      timestampISO: new Date().toISOString(),
      elapsedSeconds: Math.round((Date.now() - this.startTime) / 1000),
      type,
      target: target || 'OVERVIEW',
      details: details || {},
    };
    console.log(`[Telemetry] INTERACTION [${type}]: target="${evt.target}"`);
    this.userInteractions.push(evt);
  }

  // Record when a planet unlocks
  logUnlock({ planetId, unlockedCount }) {
    if (!this.isRecording) return;
    const evt = {
      event: 'PLANET_UNLOCKED',
      timestamp: Date.now(),
      timestampISO: new Date().toISOString(),
      elapsedSeconds: Math.round((Date.now() - this.startTime) / 1000),
      planetId,
      unlockedCount,
    };
    console.log(`[Telemetry] UNLOCK: ${planetId} (Count ${unlockedCount}/10)`);
    this.unlockEvents.push(evt);
  }

  // Record tier change event
  logTierChange({ from, to, reason }) {
    if (!this.isRecording) return;
    const evt = {
      event: 'TIER_CHANGE_EVENT',
      timestamp: Date.now(),
      timestampISO: new Date().toISOString(),
      elapsedSeconds: Math.round((Date.now() - this.startTime) / 1000),
      from,
      to,
      reason: reason || 'User override or automatic adaptation',
    };
    console.log(`[Telemetry] TIER_CHANGE: ${from} → ${to} (${evt.reason})`);
    this.tierChangeEvents.push(evt);
  }

  // Record tab visibility changes & duration spent in background
  logVisibilityEvent({ state, durationHiddenMs = 0 }) {
    if (!this.isRecording) return;
    const evt = {
      event: 'VISIBILITY_CHANGE',
      timestamp: Date.now(),
      timestampISO: new Date().toISOString(),
      elapsedSeconds: Math.round((Date.now() - this.startTime) / 1000),
      state,
      durationHiddenMs,
    };
    console.log(`[Telemetry] VISIBILITY: ${state.toUpperCase()}${state === 'visible' && durationHiddenMs > 0 ? ` (resumed after ${(durationHiddenMs / 1000).toFixed(2)}s)` : ''}`);
    this.userInteractions.push(evt);
  }

  // Record a per-second telemetry snapshot
  logSnapshot({ fps, onePercentLow, avgFrameTimeMs, maxFrameTimeMs, selectedTarget, unlockedCount, batteryStatus, isMobile, gpuTier, cameraPos, renderInfo }) {
    if (!this.isRecording) return;

    let currentMemMB = null;
    if (performance && performance.memory) {
      currentMemMB = Math.round(performance.memory.usedJSHeapSize / 1048576 * 10) / 10;
    }

    let heapDeltaMB = 0;
    let isGcSweep = false;
    if (currentMemMB !== null && this.lastMemoryMB !== null) {
      heapDeltaMB = Math.round((currentMemMB - this.lastMemoryMB) * 10) / 10;
      if (heapDeltaMB < -4.0) {
        isGcSweep = true;
      }
    }
    if (currentMemMB !== null) {
      this.lastMemoryMB = currentMemMB;
    }

    const tabVisibility = typeof document !== 'undefined' ? document.visibilityState : 'visible';

    const snapshot = {
      timestamp: Date.now(),
      elapsedSeconds: Math.round((Date.now() - this.startTime) / 1000),
      fps,
      onePercentLow,
      avgFrameTimeMs: Math.round(avgFrameTimeMs * 100) / 100,
      maxFrameTimeMs: Math.round(maxFrameTimeMs * 100) / 100,
      selectedTarget: selectedTarget || 'OVERVIEW',
      unlockedCount,
      isMobile,
      gpuTier: gpuTier || 'unknown',
      tabVisibility,
      cameraPos: cameraPos ? [
        Math.round(cameraPos.x * 10) / 10,
        Math.round(cameraPos.y * 10) / 10,
        Math.round(cameraPos.z * 10) / 10
      ] : null,
      drawCalls: renderInfo ? renderInfo.calls : null,
      triangles: renderInfo ? renderInfo.triangles : null,
      battery: batteryStatus || { charging: 'unknown', level: 'unknown' },
      memoryMB: currentMemMB !== null ? currentMemMB : 'n/a',
      heapDeltaMB,
      isGcSweep,
    };

    this.logs.push(snapshot);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  // Record an instantaneous micro-stutter event with automatic cause & severity categorization
  logStutterEvent({ frameDurationMs, selectedTarget, unlockedCount, batteryStatus, isMobile, gpuTier, cameraPos, renderInfo }) {
    if (!this.isRecording) return;

    let currentMemMB = null;
    if (performance && performance.memory) {
      currentMemMB = Math.round(performance.memory.usedJSHeapSize / 1048576 * 10) / 10;
    }

    // Categorize root cause
    let causeCategory = 'FRAME_SPIKE';
    if (currentMemMB !== null && this.lastMemoryMB !== null && (currentMemMB - this.lastMemoryMB) < -3.0) {
      causeCategory = 'V8_GARBAGE_COLLECTION';
    } else if (frameDurationMs > 100 && unlockedCount < 10) {
      causeCategory = 'SHADER_COMPILATION';
    } else if (selectedTarget !== 'OVERVIEW') {
      causeCategory = 'CAMERA_ZOOM_FILL_RATE';
    }

    // Categorize severity
    let severity = 'MINOR';
    if (frameDurationMs >= 300) severity = 'CRITICAL';
    else if (frameDurationMs >= 100) severity = 'SEVERE';
    else if (frameDurationMs >= 50) severity = 'MODERATE';

    const tabVisibility = typeof document !== 'undefined' ? document.visibilityState : 'visible';

    const stutter = {
      event: 'STUTTER_EVENT',
      timestamp: Date.now(),
      timestampISO: new Date().toISOString(),
      elapsedSeconds: Math.round((Date.now() - this.startTime) / 1000),
      frameDurationMs: Math.round(frameDurationMs * 100) / 100,
      equivalentFps: Math.round(1000 / frameDurationMs),
      severity,
      causeCategory,
      selectedTarget: selectedTarget || 'OVERVIEW',
      unlockedCount,
      isMobile,
      gpuTier: gpuTier || 'unknown',
      tabVisibility,
      cameraPos: cameraPos ? [
        Math.round(cameraPos.x * 10) / 10,
        Math.round(cameraPos.y * 10) / 10,
        Math.round(cameraPos.z * 10) / 10
      ] : null,
      drawCalls: renderInfo ? renderInfo.calls : null,
      triangles: renderInfo ? renderInfo.triangles : null,
      battery: batteryStatus || { charging: 'unknown', level: 'unknown' },
      memoryUsedMB: currentMemMB !== null ? currentMemMB : 'n/a',
    };

    this.stutterEvents.push(stutter);
    if (this.stutterEvents.length > 200) {
      this.stutterEvents.shift();
    }
  }

  // Export full diagnostic report as JSON file
  exportAsJson() {
    const gcSweepCount = this.logs.filter(l => l.isGcSweep).length;
    const severeStutters = this.stutterEvents.filter(s => s.severity === 'SEVERE' || s.severity === 'CRITICAL').length;
    
    const reportData = {
      session: this.sessionInfo,
      summary: {
        commitHash: this.sessionInfo.commitHash,
        totalSnapshots: this.logs.length,
        totalStutterEvents: this.stutterEvents.length,
        severeOrCriticalStutters: severeStutters,
        detectedGcSweeps: gcSweepCount,
        totalTierChanges: this.tierChangeEvents.length,
        totalInteractions: this.userInteractions.length,
        avgFps: this.logs.length ? Math.round(this.logs.reduce((acc, l) => acc + l.fps, 0) / this.logs.length) : 0,
        lowest1PercentFps: this.logs.length ? Math.min(...this.logs.map(l => l.onePercentLow)) : 0,
        worstStutterFrameMs: this.stutterEvents.length ? Math.max(...this.stutterEvents.map(s => s.frameDurationMs)) : 0,
      },
      userInteractions: this.userInteractions,
      unlockEvents: this.unlockEvents,
      tierChangeEvents: this.tierChangeEvents,
      stutterEvents: this.stutterEvents,
      snapshots: this.logs,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `yahya-fps-log-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Export snapshots as CSV file
  exportAsCsv() {
    if (this.logs.length === 0) return;

    const headers = ['ElapsedSec', 'FPS', 'OnePercentLow', 'AvgFrameTimeMs', 'MaxFrameTimeMs', 'Target', 'UnlockedCount', 'GpuTier', 'TabVisibility', 'DrawCalls', 'Triangles', 'CamX', 'CamY', 'CamZ', 'BatteryCharging', 'BatteryLevel', 'MemoryUsedMB', 'HeapDeltaMB', 'IsGcSweep'];
    const rows = this.logs.map(l => [
      l.elapsedSeconds,
      l.fps,
      l.onePercentLow,
      l.avgFrameTimeMs,
      l.maxFrameTimeMs,
      l.selectedTarget,
      l.unlockedCount,
      l.gpuTier,
      l.tabVisibility,
      l.drawCalls !== null ? l.drawCalls : '',
      l.triangles !== null ? l.triangles : '',
      l.cameraPos ? l.cameraPos[0] : '',
      l.cameraPos ? l.cameraPos[1] : '',
      l.cameraPos ? l.cameraPos[2] : '',
      l.battery.charging,
      l.battery.level,
      l.memoryMB,
      l.heapDeltaMB,
      l.isGcSweep
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `yahya-fps-log-${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export const fpsLogger = new FPSLogger();
