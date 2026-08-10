/**
 * detectGpuTier.js — GPU Performance Tier Detection
 *
 * Strategy:
 *  1. Try WEBGL_debug_renderer_info (fast, works in Chrome, often blocked in Brave)
 *  2. Fallback: run an offscreen FBM micro-benchmark on a WebGL canvas
 *
 * Returns: 'high' | 'med' | 'low'
 *
 * Tiers:
 *   high  → Discrete GPU (RTX, RX series, etc.)  → Full shader quality
 *   med   → Decent iGPU or older discrete         → Reduced domain-warp passes
 *   low   → Weak iGPU / old mobile GPU            → Minimal shader quality
 */

// ─── GPU Name Fast Path ──────────────────────────────────────────────────────

const HIGH_TIER_PATTERNS = [
  /rtx\s*[23456789]/i,
  /rx\s*[56789]\d{2,3}/i,
  /rx\s*[67]\d{3}/i,
  /radeon\s*r[xXm]\s*[5-9]/i,
  /quadro/i,
  /tesla/i,
  /a[2-9]\d{3}/i,             // NVIDIA A-series workstation
];

const LOW_TIER_PATTERNS = [
  /intel.*hd\s*graphics\s*[0-6]/i,
  /intel.*uhd\s*graphics\s*[0-6]/i,
  /intel.*iris.*plus/i,
  /mali/i,
  /adreno\s*[0-5]/i,
  /powervr/i,
  /videocore/i,
  /llvmpipe/i,
  /swiftshader/i,
];

function tryReadGpuName(gl) {
  try {
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    if (!ext) return null;
    const renderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);
    if (!renderer || renderer.length < 4) return null; // Brave returns empty or generic
    return renderer;
  } catch {
    return null;
  }
}

function classifyByName(name) {
  if (!name) return null;
  const n = name.toLowerCase();
  if (HIGH_TIER_PATTERNS.some((r) => r.test(n))) return 'high';
  if (LOW_TIER_PATTERNS.some((r) => r.test(n))) return 'low';
  // GTX 1060+, RX 580+, etc. → medium
  if (/gtx\s*(10[6-9]|16|[0-9]{4})/i.test(n)) return 'med';
  if (/rx\s*(4[5-9]|5[0-4])\d/i.test(n)) return 'med';
  return null; // unknown → benchmark
}

// ─── WebGL Benchmark ─────────────────────────────────────────────────────────

const BENCH_VS = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

// Domain-warped 2D FBM (4 octaves) — representative of the nebula shader cost.
// We run this on a 400×300 canvas for BENCH_FRAMES draws.
const BENCH_FS = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;

vec2 hash2(vec2 p) {
  p = vec2(dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3)));
  return -1.0 + 2.0*fract(sin(p)*43758.5453123);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f*f*(3.0-2.0*f);
  return mix(
    mix(dot(hash2(i+vec2(0,0)),f-vec2(0,0)),dot(hash2(i+vec2(1,0)),f-vec2(1,0)),u.x),
    mix(dot(hash2(i+vec2(0,1)),f-vec2(0,1)),dot(hash2(i+vec2(1,1)),f-vec2(1,1)),u.x),
    u.y);
}
float fbm(vec2 p) {
  float v=0.0, a=0.5;
  mat2 rot = mat2(0.80,0.60,-0.60,0.80);
  for(int i=0;i<4;i++){v+=a*noise(p);p=rot*p*2.07+vec2(13.4,27.9);a*=0.48;}
  return v;
}
void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = uv * 3.5;
  vec2 q = vec2(fbm(p+vec2(0.0,uTime*0.01)), fbm(p+vec2(5.2,uTime*0.013)));
  vec2 r = vec2(fbm(p+2.5*q+vec2(1.7,uTime*0.01)), fbm(p+2.5*q+vec2(8.3,uTime*0.016)));
  float d = fbm(p + 2.5*r);
  gl_FragColor = vec4(d, d*0.5, d*0.2, 1.0);
}
`;

const BENCH_CANVAS_W = 400;
const BENCH_CANVAS_H = 300;
const BENCH_FRAMES   = 5;

function compileShader(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  return sh;
}

function runBenchmark() {
  const canvas = document.createElement('canvas');
  canvas.width  = BENCH_CANVAS_W;
  canvas.height = BENCH_CANVAS_H;

  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) return 9999; // No WebGL at all → treat as worst case

  const prog = gl.createProgram();
  gl.attachShader(prog, compileShader(gl, gl.VERTEX_SHADER,   BENCH_VS));
  gl.attachShader(prog, compileShader(gl, gl.FRAGMENT_SHADER, BENCH_FS));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  // Full-screen quad
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);

  const aPos = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const uRes  = gl.getUniformLocation(prog, 'uRes');
  const uTime = gl.getUniformLocation(prog, 'uTime');
  gl.uniform2f(uRes, BENCH_CANVAS_W, BENCH_CANVAS_H);

  gl.viewport(0, 0, BENCH_CANVAS_W, BENCH_CANVAS_H);

  // Warmup frame (shader compile happens on first draw)
  gl.uniform1f(uTime, 0.0);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  gl.finish();

  // Timed frames
  const t0 = performance.now();
  for (let i = 1; i <= BENCH_FRAMES; i++) {
    gl.uniform1f(uTime, i * 0.016);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.finish(); // CPU-GPU sync — ensures we measure actual GPU time
  }
  const totalMs = performance.now() - t0;

  // Cleanup
  gl.deleteProgram(prog);
  gl.deleteBuffer(buf);

  return totalMs / BENCH_FRAMES; // avg ms per frame
}

// ─── Tier Thresholds (ms per frame on 400×300 @ 4-octave FBM) ───────────────
//
//  RTX 3060 (your machine):   ~1–3ms   → high
//  GTX 1050 / RX 580:         ~4–8ms   → med
//  Intel UHD 620 / Adreno:    ~15–50ms → low
//
const THRESH_HIGH = 8;   // < 8ms  → high
const THRESH_MED  = 20;  // < 20ms → med, else low

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Detects GPU performance tier synchronously-ish.
 * Call this ONCE at app startup (e.g. in main.jsx before render).
 * Takes ~50–200ms on weak GPUs, ~5ms on high-end GPUs.
 *
 * @returns {'high'|'med'|'low'}
 */
export function detectGpuTier() {
  try {
    // Fast path: try to read GPU name
    const probeCanvas = document.createElement('canvas');
    const probeGl = probeCanvas.getContext('webgl') || probeCanvas.getContext('experimental-webgl');
    if (probeGl) {
      const gpuName = tryReadGpuName(probeGl);
      const namedTier = classifyByName(gpuName);
      if (namedTier) {
        console.log(`[GpuTier] Detected via name: "${gpuName}" → ${namedTier}`);
        return namedTier;
      }
      if (gpuName) {
        console.log(`[GpuTier] Unknown GPU name: "${gpuName}", falling back to benchmark`);
      } else {
        console.log('[GpuTier] GPU name unavailable (Brave?), running benchmark...');
      }
    }

    // Benchmark path
    const avgMs = runBenchmark();
    const tier = avgMs < THRESH_HIGH ? 'high' : avgMs < THRESH_MED ? 'med' : 'low';
    console.log(`[GpuTier] Benchmark: ${avgMs.toFixed(1)}ms/frame → ${tier}`);
    return tier;
  } catch (err) {
    console.warn('[GpuTier] Detection failed, defaulting to med:', err);
    return 'med'; // safe default
  }
}

/**
 * Convert tier string to the float uniform value used by shaders.
 *  high → 0.0
 *  med  → 0.5
 *  low  → 1.0
 */
export function tierToFloat(tier) {
  if (tier === 'high') return 0.0;
  if (tier === 'med')  return 0.5;
  return 1.0;
}
