"use client";

import { useEffect, useRef } from "react";
import { isMobileViewport, prefersReducedMotion, useFxEnabled } from "@/app/fx/fx";

// Eye positions (fractions of frame) — measured from the portrait PNG
const LEFT_EYE = { x: 0.42, y: 0.30 };
const RIGHT_EYE = { x: 0.56, y: 0.31 };

// Vortex ring geometry (fractions of frame)
const VORTEX_CX = 0.50;
const VORTEX_CY = 0.38;
const VORTEX_R = 0.32;

// Head/shoulder occlusion ellipse
const OCC_CX = 0.50;
const OCC_CY = 0.52;
const OCC_RX = 0.22;
const OCC_RY = 0.38;

// --- Simple noise for ring texture ---
function noise2D(x: number, y: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return n - Math.floor(n);
}
function smoothNoise(x: number, y: number): number {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const a = noise2D(ix, iy), b = noise2D(ix + 1, iy), c = noise2D(ix, iy + 1), d = noise2D(ix + 1, iy + 1);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}
function fbm(x: number, y: number, oct: number): number {
  let v = 0, a = 0.5, f = 1;
  for (let i = 0; i < oct; i++) { v += a * smoothNoise(x * f, y * f); a *= 0.5; f *= 2; }
  return v;
}

// --- Surge timing (shared with vortex + eye bloom) ---
type SurgeState = { phase: "idle" | "building" | "peak" | "decay"; timer: number; intensity: number; nextSurge: number };
function advanceSurge(s: SurgeState, dt: number): void {
  s.timer -= dt;
  if (s.timer <= 0) {
    switch (s.phase) {
      case "idle": s.phase = "building"; s.timer = 200 + Math.random() * 300; break;
      case "building": s.phase = "peak"; s.timer = 100 + Math.random() * 200; break;
      case "peak": s.phase = "decay"; s.timer = 400 + Math.random() * 600; break;
      case "decay": s.phase = "idle"; s.timer = s.nextSurge; s.nextSurge = 2000 + Math.random() * 5000; break;
    }
  }
  const targets: Record<string, number> = { idle: 0.15, building: 0.6, peak: 1.0, decay: 0.25 };
  const rate = s.phase === "peak" ? 0.18 : 0.04;
  s.intensity += (targets[s.phase] - s.intensity) * rate;
}

// --- Orbital spark ---
type Spark = { angle: number; speed: number; r: number; rWobble: number; wobblePhase: number; life: number; maxLife: number; size: number; trail: number; flung: boolean };
function mkSpark(vr: number): Spark {
  const flung = Math.random() < 0.06;
  return { angle: Math.random() * Math.PI * 2, speed: (0.25 + Math.random() * 0.45) * (Math.random() < 0.4 ? -1 : 1), r: vr * (0.92 + Math.random() * 0.16), rWobble: vr * (0.02 + Math.random() * 0.05), wobblePhase: Math.random() * Math.PI * 2, life: 0, maxLife: flung ? 50 + Math.random() * 70 : 220 + Math.random() * 400, size: 0.7 + Math.random() * 1.6, trail: 5 + Math.random() * 10, flung };
}

// --- Circumference pulse ---
type Pulse = { angle: number; speed: number; life: number; maxLife: number };

// --- Main component ---
export type LivingPortraitState = { proximity: number; hovering: boolean };

export function LivingPortrait({ stateRef }: { stateRef: React.RefObject<LivingPortraitState> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fxOn = useFxEnabled();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !fxOn) return;
    const reduced = prefersReducedMotion();
    const mobile = isMobileViewport();
    const ctxM = canvas.getContext("2d");
    if (!ctxM) return;
    const ctx = ctxM;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0, h = 0, frame = 0, visible = true, lastTime = performance.now(), elapsed = 0;

    const surge: SurgeState = { phase: "idle", timer: 600 + Math.random() * 2000, intensity: 0.15, nextSurge: 2500 + Math.random() * 4000 };

    // Ring rotation (3 rings, different speeds, at least one counter-clockwise)
    const ringAngles = [0, 0, 0];
    const ringSpeeds = [0.10, -0.16, 0.07]; // rad/s

    // Orbital sparks
    const sparkCount = mobile ? 12 : 30;
    let sparks: Spark[] = [];
    let vr = 0;

    // Circumference pulses
    const pulses: Pulse[] = [];
    let pulseTimer = 3000 + Math.random() * 5000;

    // Embers
    const emberN = mobile ? 5 : 12;
    const embers: { x: number; y: number; vx: number; vy: number; life: number; max: number; sz: number }[] = [];
    for (let i = 0; i < emberN; i++) embers.push({ x: 0, y: 0, vx: 0, vy: 0, life: 9999, max: 100, sz: 1 });

    function spawnEmber(e: typeof embers[0]) {
      const a = Math.random() * Math.PI * 2, r = vr * (0.7 + Math.random() * 0.5);
      e.x = w * VORTEX_CX + Math.cos(a) * r; e.y = h * VORTEX_CY + Math.sin(a) * r;
      e.vx = (Math.random() - 0.5) * 0.35; e.vy = -0.3 - Math.random() * 0.6;
      e.life = 0; e.max = 100 + Math.random() * 160; e.sz = 0.4 + Math.random() * 1.1;
    }

    let grainData: ImageData | null = null;

    const resize = () => {
      const b = canvas.getBoundingClientRect();
      w = b.width; h = b.height;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      vr = VORTEX_R * w;
      sparks = []; for (let i = 0; i < sparkCount; i++) sparks.push(mkSpark(vr));
      grainData = null;
    };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !frame) frame = requestAnimationFrame(tick); }); io.observe(canvas);

    function isOcc(px: number, py: number): boolean {
      const dx = (px - w * OCC_CX) / (w * OCC_RX), dy = (py - h * OCC_CY) / (h * OCC_RY);
      return dx * dx + dy * dy < 1;
    }

    // === ENERGY RING: thick, chunky, plasma-like ===
    function drawRing(angle: number, baseR: number, thickness: number, alpha: number, hue: number) {
      const cx = w * VORTEX_CX, cy = h * VORTEX_CY;
      const segs = mobile ? 80 : 160;
      const step = (Math.PI * 2) / segs;

      for (let i = 0; i < segs; i++) {
        const a = angle + i * step;
        // FBM noise for chunky, organic plasma texture
        const n = fbm(Math.cos(a) * 2.5 + elapsed * 0.4, Math.sin(a) * 2.5 + elapsed * 0.25, 4);
        // Create organic gaps (like tendrils breaking apart)
        if (n < 0.25) continue;

        const wobble = (n - 0.5) * baseR * 0.14; // bigger wobble = chunkier
        const r = baseR + wobble;
        const x1 = cx + Math.cos(a) * r, y1 = cy + Math.sin(a) * r;
        const x2 = cx + Math.cos(a + step) * r, y2 = cy + Math.sin(a + step) * r;

        // Depth occlusion
        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
        const oa = isOcc(mx, my) ? alpha * 0.06 : alpha;

        const bright = 0.4 + n * 0.6;
        // Thick outer glow (the "plasma" feel)
        const thk = thickness * (0.6 + n * 1.2);
        ctx.strokeStyle = `hsla(${hue}, 85%, ${30 + bright * 20}%, ${(oa * bright * 0.25).toFixed(3)})`;
        ctx.lineWidth = thk * 5;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();

        // Core
        ctx.strokeStyle = `hsla(${hue}, 80%, ${50 + bright * 30}%, ${(oa * bright * 0.7).toFixed(3)})`;
        ctx.lineWidth = thk;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();

        // White-hot bright spots where noise peaks
        if (n > 0.7) {
          ctx.strokeStyle = `hsla(${hue - 10}, 60%, ${70 + bright * 20}%, ${(oa * (n - 0.7) * 1.5).toFixed(3)})`;
          ctx.lineWidth = thk * 0.5;
          ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        }
      }
    }

    // === EYE BLOOM: amplify the painted-in lightning, don't replace it ===
    function drawEyeBloom(ex: number, ey: number, intensity: number) {
      const baseR = Math.min(w, h) * 0.055;

      // Broad soft glow — like the light from the painted lightning spilling onto the face
      const r1 = baseR * (1.5 + intensity * 2.5);
      const a1 = 0.06 + intensity * 0.18;
      const g1 = ctx.createRadialGradient(ex, ey, 0, ex, ey, r1);
      g1.addColorStop(0, `rgba(180, 150, 255, ${(a1 * 0.8).toFixed(3)})`);
      g1.addColorStop(0.25, `rgba(140, 90, 255, ${(a1 * 0.5).toFixed(3)})`);
      g1.addColorStop(0.5, `rgba(100, 50, 230, ${(a1 * 0.2).toFixed(3)})`);
      g1.addColorStop(1, "rgba(80, 30, 200, 0)");
      ctx.fillStyle = g1;
      ctx.fillRect(ex - r1, ey - r1, r1 * 2, r1 * 2);

      // Intense core bloom — white-hot center that matches the painted eye glow
      const r2 = baseR * (0.4 + intensity * 0.6);
      const a2 = 0.15 + intensity * 0.4;
      const g2 = ctx.createRadialGradient(ex, ey, 0, ex, ey, r2);
      g2.addColorStop(0, `rgba(240, 230, 255, ${(a2).toFixed(3)})`);
      g2.addColorStop(0.4, `rgba(200, 170, 255, ${(a2 * 0.5).toFixed(3)})`);
      g2.addColorStop(1, "rgba(155, 92, 255, 0)");
      ctx.fillStyle = g2;
      ctx.beginPath(); ctx.arc(ex, ey, r2, 0, Math.PI * 2); ctx.fill();

      // Pulsing intensity flicker (subtle — makes it feel alive, not mechanical)
      if (intensity > 0.5) {
        const flicker = Math.sin(elapsed * 12 + ex) * 0.5 + 0.5;
        const r3 = baseR * 0.8 * flicker;
        const a3 = (intensity - 0.5) * 0.12 * flicker;
        ctx.fillStyle = `rgba(220, 200, 255, ${a3.toFixed(3)})`;
        ctx.beginPath(); ctx.arc(ex, ey, r3, 0, Math.PI * 2); ctx.fill();
      }
    }

    // === ANAMORPHIC FLARE: horizontal streak at peak surges ===
    function drawFlare(ex: number, ey: number, intensity: number) {
      if (intensity < 0.5) return;
      const sw = w * 0.25 * intensity, sh = 1.5 + intensity * 2.5;
      const a = (intensity - 0.5) * 0.1;
      const g = ctx.createLinearGradient(ex - sw, ey, ex + sw, ey);
      g.addColorStop(0, "rgba(140, 100, 255, 0)");
      g.addColorStop(0.35, `rgba(170, 140, 255, ${a.toFixed(3)})`);
      g.addColorStop(0.5, `rgba(210, 190, 255, ${(a * 1.3).toFixed(3)})`);
      g.addColorStop(0.65, `rgba(170, 140, 255, ${a.toFixed(3)})`);
      g.addColorStop(1, "rgba(140, 100, 255, 0)");
      ctx.fillStyle = g;
      ctx.fillRect(ex - sw, ey - sh / 2, sw * 2, sh);
    }

    // === ORBITAL SPARK ===
    function drawSpark(s: Spark, cx: number, cy: number, prox: number) {
      const wobble = Math.sin(s.wobblePhase + elapsed * 2.5) * s.rWobble;
      const r = s.r + wobble + (s.flung ? s.life * 0.7 : 0);
      const x = cx + Math.cos(s.angle) * r, y = cy + Math.sin(s.angle) * r;
      if (isOcc(x, y)) return;

      const fade = s.flung ? 1 - s.life / s.maxLife : Math.sin((s.life / s.maxLife) * Math.PI);
      const bright = 0.35 + prox * 0.25 + fade * 0.4;

      const ta = s.angle - s.speed * 0.04 * s.trail;
      const tx = cx + Math.cos(ta) * r, ty = cy + Math.sin(ta) * r;
      const g = ctx.createLinearGradient(tx, ty, x, y);
      g.addColorStop(0, "rgba(100, 50, 255, 0)");
      g.addColorStop(0.6, `rgba(170, 110, 255, ${(bright * 0.35 * fade).toFixed(3)})`);
      g.addColorStop(1, `rgba(255, 240, 255, ${(bright * 0.85 * fade).toFixed(3)})`);
      ctx.strokeStyle = g; ctx.lineWidth = s.size;
      ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(x, y); ctx.stroke();

      ctx.fillStyle = `rgba(255, 250, 255, ${(bright * 0.6 * fade).toFixed(3)})`;
      ctx.beginPath(); ctx.arc(x, y, s.size * 0.5, 0, Math.PI * 2); ctx.fill();
    }

    // === CIRCUMFERENCE PULSE ===
    function drawPulse(p: Pulse, cx: number, cy: number, pvr: number) {
      const t = p.life / p.maxLife, alpha = (1 - t) * 0.5;
      const arcLen = 0.6 + t * 1.2;
      ctx.strokeStyle = `rgba(190, 150, 255, ${alpha.toFixed(3)})`;
      ctx.lineWidth = 3 + (1 - t) * 5;
      ctx.beginPath(); ctx.arc(cx, cy, pvr, p.angle - arcLen / 2, p.angle + arcLen / 2); ctx.stroke();
      ctx.strokeStyle = `rgba(130, 70, 255, ${(alpha * 0.3).toFixed(3)})`;
      ctx.lineWidth = 14 + (1 - t) * 10;
      ctx.beginPath(); ctx.arc(cx, cy, pvr, p.angle - arcLen / 2, p.angle + arcLen / 2); ctx.stroke();
    }

    function drawGrain() {
      const gw = 128, gh = 128;
      if (!grainData || Math.random() < 0.06) {
        grainData = ctx.createImageData(gw, gh);
        const d = grainData.data;
        for (let i = 0; i < d.length; i += 4) { const v = Math.random() * 255; d[i] = v; d[i + 1] = v; d[i + 2] = v; d[i + 3] = 5; }
      }
      for (let gx = 0; gx < w; gx += gw) for (let gy = 0; gy < h; gy += gh) ctx.putImageData(grainData, gx * dpr, gy * dpr);
    }

    // ======== MAIN RENDER LOOP ========
    const tick = (now: number) => {
      frame = 0;
      if (!visible) return;
      const dt = Math.min(now - lastTime, 50);
      lastTime = now;
      elapsed += dt / 1000;
      const prox = stateRef.current?.proximity ?? 0;

      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";

      advanceSurge(surge, dt * (1 + prox * 1.5));
      const intensity = Math.min(1, surge.intensity + prox * 0.25);
      const vcx = w * VORTEX_CX, vcy = h * VORTEX_CY;
      const pSpeed = 1 + prox * 0.3;

      // 1. ROTATING ENERGY RINGS (thick, chunky, plasma-like)
      if (!reduced) {
        const ringN = mobile ? 1 : 3;
        const radii = [vr * 0.94, vr * 1.06, vr * 0.82];
        const thicks = [3.5, 2.5, 1.8];
        const alphas = [0.3, 0.2, 0.15];
        const hues = [268, 258, 278];
        for (let r = 0; r < ringN; r++) {
          ringAngles[r] += ringSpeeds[r] * (dt / 1000) * pSpeed;
          drawRing(ringAngles[r], radii[r], thicks[r], alphas[r] + intensity * 0.12, hues[r]);
        }
      } else {
        ctx.strokeStyle = "rgba(130, 70, 255, 0.1)"; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(vcx, vcy, vr, 0, Math.PI * 2); ctx.stroke();
      }

      // 2. CIRCUMFERENCE PULSES
      if (!reduced) {
        pulseTimer -= dt;
        if (pulseTimer <= 0) {
          pulseTimer = 4000 + Math.random() * 5000;
          pulses.push({ angle: Math.random() * Math.PI * 2, speed: 1.0 + Math.random() * 0.8, life: 0, maxLife: 900 + Math.random() * 700 });
          if (pulses.length > 3) pulses.shift();
        }
        for (let i = pulses.length - 1; i >= 0; i--) {
          const p = pulses[i]; p.life += dt; p.angle += p.speed * (dt / 1000) * pSpeed;
          if (p.life > p.maxLife) { pulses.splice(i, 1); continue; }
          drawPulse(p, vcx, vcy, vr);
        }
      }

      // 3. ORBITAL SPARKS
      if (!reduced) {
        for (const s of sparks) {
          s.angle += s.speed * (dt / 1000) * pSpeed; s.life += dt;
          if (s.life > s.maxLife) { Object.assign(s, mkSpark(vr)); continue; }
          drawSpark(s, vcx, vcy, prox);
        }
      }

      // 4. EYE BLOOM (amplifies the painted-in eye lightning)
      const lx = LEFT_EYE.x * w, ly = LEFT_EYE.y * h;
      const rx = RIGHT_EYE.x * w, ry = RIGHT_EYE.y * h;
      drawEyeBloom(lx, ly, intensity);
      drawEyeBloom(rx, ry, intensity);
      if (!reduced) { drawFlare(lx, ly, intensity); drawFlare(rx, ry, intensity); }

      // 5. EMBERS
      if (!reduced) {
        for (const e of embers) {
          e.life++; if (e.life > e.max) { spawnEmber(e); continue; }
          e.x += e.vx; e.y += e.vy; e.vy -= 0.003;
          const fade = Math.sin((e.life / e.max) * Math.PI);
          ctx.fillStyle = Math.random() < 0.3 ? `rgba(103,239,255,${(fade * 0.4).toFixed(3)})` : `rgba(180,110,255,${(fade * 0.45).toFixed(3)})`;
          ctx.beginPath(); ctx.arc(e.x, e.y, e.sz, 0, Math.PI * 2); ctx.fill();
        }
      }

      // 6. FILM GRAIN
      if (!reduced && !mobile) { ctx.globalCompositeOperation = "source-over"; drawGrain(); }

      // 7. VIGNETTE
      ctx.globalCompositeOperation = "source-over";
      const vig = ctx.createRadialGradient(w * 0.5, h * 0.45, w * 0.18, w * 0.5, h * 0.5, w * 0.72);
      vig.addColorStop(0, "rgba(0,0,0,0)"); vig.addColorStop(1, "rgba(2,1,8,0.32)");
      ctx.fillStyle = vig; ctx.fillRect(0, 0, w, h);

      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => { if (frame) cancelAnimationFrame(frame); ro.disconnect(); io.disconnect(); };
  }, [fxOn, stateRef]);

  return <canvas ref={canvasRef} className="living-portrait-canvas" aria-hidden="true" />;
}
