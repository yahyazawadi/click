/**
 * detectGpuTier.js — GPU Performance Tier Detection
 *
 * Strategy:
 *  1. Try WEBGL_debug_renderer_info (fast, works in Chrome, Firefox, etc.)
 *  2. Classify iGPUs / APUs (Radeon 760M/780M, Iris Xe, Vega) as 'med' by default
 *  3. Classify known high-end discrete GPUs (RTX, RX 6000/7000, etc.) as 'high'
 *  4. Fallback: run an offscreen FBM micro-benchmark on a WebGL canvas (< 4.5ms → high, < 18ms → med, else low)
 *
 * Returns: 'high' | 'med' | 'low'
 */

// ─── GPU Name Patterns ───────────────────────────────────────────────────────

const HIGH_TIER_PATTERNS = [
  /rtx\s*[23456789]\d{3}/i,    // RTX 2060, 3060, 4070, etc.
  /rtx\s*a\d{3,4}/i,           // RTX A4000, A5000
  /rx\s*[67]\d{3}/i,           // RX 6600, 6700, 7800, 7900
  /rx\s*5[789]00/i,            // RX 5700, 5800
  /quadro\s*r/i,
  /tesla/i,
];

// iGPUs / APUs / Mobile integrated graphics → Default to 'med' to ensure 60fps stability
const MED_TIER_PATTERNS = [
  /radeon\s*[6789]\d{2}[ms]/i, // Radeon 760M, 780M, 680M, 890M APUs
  /radeon\s*graphics/i,        // Generic AMD APU graphics
  /radeon\s*r[579]\s*graphics/i,
  /vega\s*\d+/i,               // AMD Vega 8, 11
  /iris\s*xe/i,                // Intel Iris Xe
  /intel.*graphics/i,          // Intel UHD/HD/Arc Mobile
  /apple\s*m[1234]/i,          // Apple Silicon integrated
  /gtx\s*(10[5-8]|16[56]|9[78])/i, // Mid-range GTX (1060, 1660, 1050Ti)
  /rx\s*(4[78]0|5[789]0)/i,    // Older mid RX (RX 480, 580)
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

  if (HIGH_TIER_PATTERNS.some((r) => r.test(n))) {
    return { tier: 'high', reason: 'High-performance discrete GPU match' };
  }
  if (MED_TIER_PATTERNS.some((r) => r.test(n))) {
    return { tier: 'med', reason: 'Integrated APU / Mid-range GPU match' };
  }
  if (LOW_TIER_PATTERNS.some((r) => r.test(n))) {
    return { tier: 'low', reason: 'Low-power / legacy GPU match' };
  }
  return null; // Unknown → run benchmark
}

// ─── WebGL Benchmark ─────────────────────────────────────────────────────────

const BENCH_VS = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

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
  if (!gl) return 9999;

  const prog = gl.createProgram();
  gl.attachShader(prog, compileShader(gl, gl.VERTEX_SHADER,   BENCH_VS));
  gl.attachShader(prog, compileShader(gl, gl.FRAGMENT_SHADER, BENCH_FS));
  gl.linkProgram(prog);
  gl.useProgram(prog);

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

  // Warmup frame
  gl.uniform1f(uTime, 0.0);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  gl.finish();

  // Timed frames
  const t0 = performance.now();
  for (let i = 1; i <= BENCH_FRAMES; i++) {
    gl.uniform1f(uTime, i * 0.016);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.finish();
  }
  const totalMs = performance.now() - t0;

  gl.deleteProgram(prog);
  gl.deleteBuffer(buf);

  return totalMs / BENCH_FRAMES;
}

// Benchmark Thresholds (ms per frame on 400×300 canvas):
//   High-end discrete GPU (RTX 3060/4060): ~1.0 – 3.0 ms  → HIGH (< 4.5ms)
//   Mid-range / fast APU (Radeon 760M, GTX 1060): ~4.5 – 18.0 ms → MED (< 18.0ms)
//   Low-end iGPU (Intel UHD 620): > 18.0 ms               → LOW
const THRESH_HIGH = 4.5;
const THRESH_MED  = 18.0;

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Detects GPU performance tier synchronously.
 * Logs renderer info & classification reason to console.
 *
 * @returns {'high'|'med'|'low'}
 */
export function detectGpuTier() {
  try {
    const probeCanvas = document.createElement('canvas');
    const probeGl = probeCanvas.getContext('webgl') || probeCanvas.getContext('experimental-webgl');
    if (probeGl) {
      const gpuName = tryReadGpuName(probeGl);
      if (gpuName) {
        const result = classifyByName(gpuName);
        if (result) {
          console.log(`[GpuTier] GPU: "${gpuName}" → TIER: ${result.tier.toUpperCase()} (${result.reason})`);
          return result.tier;
        }
        console.log(`[GpuTier] GPU: "${gpuName}" (Unrecognized name, running WebGL benchmark...)`);
      } else {
        console.log('[GpuTier] GPU renderer string blocked/unavailable (Brave?), running WebGL benchmark...');
      }
    }

    // Benchmark path
    const avgMs = runBenchmark();
    const tier = avgMs < THRESH_HIGH ? 'high' : avgMs < THRESH_MED ? 'med' : 'low';
    console.log(`[GpuTier] WebGL Benchmark: ${avgMs.toFixed(2)}ms/frame → TIER: ${tier.toUpperCase()} (Thresholds: high < ${THRESH_HIGH}ms, med < ${THRESH_MED}ms)`);
    return tier;
  } catch (err) {
    console.warn('[GpuTier] Detection failed, defaulting to med:', err);
    return 'med';
  }
}

export function tierToFloat(tier) {
  if (tier === 'high') return 0.0;
  if (tier === 'med')  return 0.5;
  return 1.0;
}
