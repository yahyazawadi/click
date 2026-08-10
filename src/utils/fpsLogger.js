/**
 * YAHYA.CLICK — COMPREHENSIVE FPS TELEMETRY & EVENT LOGGER
 * Continuously records frame timing, 1% lows, memory, battery, hardware telemetry,
 * and captures STUTTER_EVENTS (>33ms / >50ms frame spikes).
 * Supports 1-click JSON and CSV export.
 */

class FPSLogger {
  constructor() {
    this.logs = [];
    this.stutterEvents = [];
    this.maxLogs = 600; // 10 minutes at 1 snapshot/sec
    this.startTime = Date.now();
    this.sessionInfo = this.getDeviceInfo();
    this.isRecording = true;
    
    // Global reference for debugging in devtools console
    if (typeof window !== 'undefined') {
      window.__FPS_LOGGER__ = this;
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

    return {
      userAgent: ua,
      browser,
      gpuRenderer,
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio || 1,
      hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
      touchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      startTimeISO: new Date().toISOString(),
    };
  }

  // Record a per-second telemetry snapshot
  logSnapshot({ fps, onePercentLow, avgFrameTimeMs, maxFrameTimeMs, selectedTarget, unlockedCount, batteryStatus, isMobile }) {
    if (!this.isRecording) return;

    const memoryInfo = (performance && performance.memory) ? {
      totalJSHeapSizeMB: Math.round(performance.memory.totalJSHeapSize / 1048576 * 10) / 10,
      usedJSHeapSizeMB: Math.round(performance.memory.usedJSHeapSize / 1048576 * 10) / 10,
      jsHeapSizeLimitMB: Math.round(performance.memory.jsHeapSizeLimit / 1048576 * 10) / 10,
    } : null;

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
      battery: batteryStatus || { charging: 'unknown', level: 'unknown' },
      memoryMB: memoryInfo ? memoryInfo.usedJSHeapSizeMB : 'n/a',
    };

    this.logs.push(snapshot);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  // Record an instantaneous micro-stutter event (single frame > 33ms)
  logStutterEvent({ frameDurationMs, selectedTarget, unlockedCount, batteryStatus, isMobile }) {
    if (!this.isRecording) return;

    const memoryInfo = (performance && performance.memory) ? 
      Math.round(performance.memory.usedJSHeapSize / 1048576 * 10) / 10 : null;

    const stutter = {
      event: 'STUTTER_EVENT',
      timestamp: Date.now(),
      timestampISO: new Date().toISOString(),
      elapsedSeconds: Math.round((Date.now() - this.startTime) / 1000),
      frameDurationMs: Math.round(frameDurationMs * 100) / 100,
      equivalentFps: Math.round(1000 / frameDurationMs),
      selectedTarget: selectedTarget || 'OVERVIEW',
      unlockedCount,
      isMobile,
      battery: batteryStatus || { charging: 'unknown', level: 'unknown' },
      memoryUsedMB: memoryInfo !== null ? memoryInfo : 'n/a',
    };

    this.stutterEvents.push(stutter);
    if (this.stutterEvents.length > 200) {
      this.stutterEvents.shift();
    }
  }

  // Export full diagnostic report as JSON file
  exportAsJson() {
    const reportData = {
      session: this.sessionInfo,
      summary: {
        totalSnapshots: this.logs.length,
        totalStutterEvents: this.stutterEvents.length,
        avgFps: this.logs.length ? Math.round(this.logs.reduce((acc, l) => acc + l.fps, 0) / this.logs.length) : 0,
        lowest1PercentFps: this.logs.length ? Math.min(...this.logs.map(l => l.onePercentLow)) : 0,
        worstStutterFrameMs: this.stutterEvents.length ? Math.max(...this.stutterEvents.map(s => s.frameDurationMs)) : 0,
      },
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

    const headers = ['ElapsedSec', 'FPS', 'OnePercentLow', 'AvgFrameTimeMs', 'MaxFrameTimeMs', 'Target', 'UnlockedCount', 'BatteryCharging', 'BatteryLevel', 'MemoryUsedMB'];
    const rows = this.logs.map(l => [
      l.elapsedSeconds,
      l.fps,
      l.onePercentLow,
      l.avgFrameTimeMs,
      l.maxFrameTimeMs,
      l.selectedTarget,
      l.unlockedCount,
      l.battery.charging,
      l.battery.level,
      l.memoryMB
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
