"use client";

import { useEffect, useRef } from "react";
import { isMobileViewport, prefersReducedMotion, useFxEnabled } from "@/app/fx/fx";

// Eye positions as fractions of the portrait frame
const LEFT_EYE = { x: 0.42, y: 0.30 };
const RIGHT_EYE = { x: 0.56, y: 0.31 };

// Vortex ring geometry (fractions of frame)
const VORTEX_CX = 0.50;
const VORTEX_CY = 0.38;
const VORTEX_R = 0.32; // radius as fraction of width

// Head/shoulder occlusion ellipse (rough silhouette)
const OCCLUDE_CX = 0.50;
const OCCLUDE_CY = 0.52;
const OCCLUDE_RX = 0.22;
const OCCLUDE_RY = 0.38;

// --- Lightning arc via midpoint displacement ---
type Point = { x: number; y: number };

function buildArc(s: Point, e: Point, d: number, depth: number, pts: Point[]) {
  if (depth <= 0) { pts.push(e); return; }
  const mid = { x: (s.x + e.x) / 2 + (Math.random() - 0.5) * d, y: (s.y + e.y) / 2 + (Math.random() - 0.5) * d };
  buildArc(s, mid, d * 0.52, depth - 1, pts);
  buildArc(mid, e, d * 0.52, depth - 1, pts);
}

function generateArc(s: Point, e: Point, spread: number): Point[] {
  const pts: Point[] = [s];
  buildArc(s, e, spread, 5, pts);
  return pts;
}

// --- Simple 2D noise for ring texture ---
function noise2D(x: number, y: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

function smoothNoise(x: number, y: number): number {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const a = noise2D(ix, iy), b = noise2D(ix + 1, iy);
  const c = noise2D(ix, iy + 1), d = noise2D(ix + 1, iy + 1);
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}

function fbmNoise(x: number, y: number, octaves: number): number {
  let val = 0, amp = 0.5, freq = 1;
  for (let i = 0; i < octaves; i++) {
    val += amp * smoothNoise(x * freq, y * freq);
    amp *= 0.5; freq *= 2;
  }
  return val;
}

// --- Surge timing ---
type SurgeState = { phase: "idle" | "building" | "peak" | "decay"; timer: number; intensity: number; nextSurge: number };

function advanceSurge(s: SurgeState, dt: number): void {
  s.timer -= dt;
  if (s.timer <= 0) {
    switch (s.phase) {
      case "idle": s.phase = "building"; s.timer = 200 + Math.random() * 300; break;
      case "building": s.phase = "peak"; s.timer = 80 + Math.random() * 180; break;
      case "peak": s.phase = "decay"; s.timer = 300 + Math.random() * 500; break;
      case "decay": s.phase = "idle"; s.timer = s.nextSurge; s.nextSurge = 1800 + Math.random() * 4000; break;
    }
  }
  const targets: Record<string, number> = { idle: 0.12, building: 0.55, peak: 1.0, decay: 0.2 };
  const rate = s.phase === "peak" ? 0.15 : 0.04;
  s.intensity += (targets[s.phase] - s.intensity) * rate;
}

// --- Orbital spark ---
type Spark = { angle: number; speed: number; radius: number; radiusWobble: number; wobblePhase: number; life: number; maxLife: number; size: number; trail: number; flung: boolean };

function spawnSpark(vr: number): Spark {
  const flung = Math.random() < 0.08;
  return {
    angle: Math.random() * Math.PI * 2,
    speed: (0.3 + Math.random() * 0.5) * (Math.random() < 0.4 ? -1 : 1),
    radius: vr * (0.95 + Math.random() * 0.1),
    radiusWobble: vr * (0.02 + Math.random() * 0.04),
    wobblePhase: Math.random() * Math.PI * 2,
    life: 0,
    maxLife: flung ? 60 + Math.random() * 80 : 200 + Math.random() * 400,
    size: 0.8 + Math.random() * 1.8,
    trail: 4 + Math.random() * 8,
    flung,
  };
}

// --- Circumference pulse ---
type Pulse = { angle: number; speed: number; life: number; maxLife: number };

// --- Main component ---
export type LivingPortraitState = {
  proximity: number;
  hovering: boolean;
};

export function LivingPortrait({ stateRef }: { stateRef: React.RefObject<LivingPortraitState> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fxOn = useFxEnabled();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !fxOn) return;
    const reduced = prefersReducedMotion();
    const mobile = isMobileViewport();
    const ctxMaybe = canvas.getContext("2d");
    if (!ctxMaybe) return;
    const ctx = ctxMaybe;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0, h = 0, frame = 0, visible = true, lastTime = performance.now();
    let elapsed = 0; // total elapsed seconds for ring rotation

    const surge: SurgeState = { phase: "idle", timer: 800 + Math.random() * 2000, intensity: 0.12, nextSurge: 2000 + Math.random() * 3000 };

    // Eye lightning arcs
    const maxArcs = mobile ? 3 : 6;
    const arcs: { points: Point[]; life: number; maxLife: number; width: number; fork: boolean }[] = [];
    let arcTimer = 0;

    // Orbital sparks
    const sparkCount = mobile ? 15 : 32;
    let sparks: Spark[] = [];
    let vortexRadius = 0;

    // Circumference pulses
    const pulses: Pulse[] = [];
    let pulseTimer = 4000 + Math.random() * 4000;

    // Energy ring rotation angles (3 rings, different speeds)
    const ringAngles = [0, 0, 0];
    const ringSpeeds = [0.12, -0.18, 0.08]; // radians/s — ring 2 is counter-clockwise

    // Embers
    const emberCount = mobile ? 6 : 14;
    const embers: { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; size: number }[] = [];
    for (let i = 0; i < emberCount; i++) embers.push({ x: 0, y: 0, vx: 0, vy: 0, life: 9999, maxLife: 100, size: 1 });

    function spawnEmber(e: typeof embers[0]) {
      const angle = Math.random() * Math.PI * 2;
      const r = vortexRadius * (0.8 + Math.random() * 0.4);
      e.x = w * VORTEX_CX + Math.cos(angle) * r;
      e.y = h * VORTEX_CY + Math.sin(angle) * r;
      e.vx = (Math.random() - 0.5) * 0.4;
      e.vy = -0.3 - Math.random() * 0.7;
      e.life = 0;
      e.maxLife = 120 + Math.random() * 180;
      e.size = 0.5 + Math.random() * 1.2;
    }

    // Film grain buffer
    let grainData: ImageData | null = null;

    const resize = () => {
      const b = canvas.getBoundingClientRect();
      w = b.width; h = b.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      vortexRadius = VORTEX_R * w;
      sparks = [];
      for (let i = 0; i < sparkCount; i++) sparks.push(spawnSpark(vortexRadius));
      grainData = null;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !frame) frame = requestAnimationFrame(tick);
    });
    io.observe(canvas);

    // --- Utility: check if point is inside the head/shoulder occlusion ellipse ---
    function isOccluded(px: number, py: number): boolean {
      const dx = (px - w * OCCLUDE_CX) / (w * OCCLUDE_RX);
      const dy = (py - h * OCCLUDE_CY) / (h * OCCLUDE_RY);
      return dx * dx + dy * dy < 1;
    }

    // --- Draw energy ring (noise-textured arc with gaps) ---
    function drawEnergyRing(ringAngle: number, baseRadius: number, thickness: number, alpha: number, hue: number) {
      const cx = w * VORTEX_CX, cy = h * VORTEX_CY;
      const segments = mobile ? 60 : 120;
      const step = (Math.PI * 2) / segments;

      ctx.lineWidth = thickness;
      for (let i = 0; i < segments; i++) {
        const a = ringAngle + i * step;
        const noiseVal = fbmNoise(Math.cos(a) * 3 + elapsed * 0.5, Math.sin(a) * 3 + elapsed * 0.3, 3);
        // Create gaps in the ring
        if (noiseVal < 0.3) continue;

        const wobble = (noiseVal - 0.5) * baseRadius * 0.08;
        const r = baseRadius + wobble;
        const x1 = cx + Math.cos(a) * r;
        const y1 = cy + Math.sin(a) * r;
        const x2 = cx + Math.cos(a + step) * r;
        const y2 = cy + Math.sin(a + step) * r;

        // Depth occlusion: dim segments behind the head
        const midX = (x1 + x2) / 2, midY = (y1 + y2) / 2;
        const occAlpha = isOccluded(midX, midY) ? alpha * 0.08 : alpha;

        const brightness = 0.5 + noiseVal * 0.5;
        ctx.strokeStyle = `hsla(${hue}, 80%, ${45 + brightness * 25}%, ${(occAlpha * brightness).toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    }

    // --- Draw orbital spark ---
    function drawSpark(s: Spark, cx: number, cy: number, prox: number) {
      const wobble = Math.sin(s.wobblePhase + elapsed * 2.5) * s.radiusWobble;
      const r = s.radius + wobble + (s.flung ? s.life * 0.8 : 0);
      const x = cx + Math.cos(s.angle) * r;
      const y = cy + Math.sin(s.angle) * r;

      // Depth occlusion
      if (isOccluded(x, y)) return;

      const fade = s.flung
        ? 1 - s.life / s.maxLife
        : Math.sin((s.life / s.maxLife) * Math.PI);
      const bright = 0.4 + prox * 0.3 + fade * 0.3;

      // Motion trail
      const trailAngle = s.angle - s.speed * 0.04 * s.trail;
      const tx = cx + Math.cos(trailAngle) * r;
      const ty = cy + Math.sin(trailAngle) * r;

      const grad = ctx.createLinearGradient(tx, ty, x, y);
      grad.addColorStop(0, `rgba(120, 60, 255, 0)`);
      grad.addColorStop(0.7, `rgba(180, 120, 255, ${(bright * 0.4 * fade).toFixed(3)})`);
      grad.addColorStop(1, `rgba(255, 255, 255, ${(bright * 0.9 * fade).toFixed(3)})`);
      ctx.strokeStyle = grad;
      ctx.lineWidth = s.size;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(x, y);
      ctx.stroke();

      // White-hot core
      ctx.fillStyle = `rgba(255, 255, 255, ${(bright * 0.7 * fade).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(x, y, s.size * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }

    // --- Draw circumference pulse ---
    function drawPulse(p: Pulse, cx: number, cy: number, vr: number) {
      const t = p.life / p.maxLife;
      const alpha = (1 - t) * 0.6;
      const arcLen = 0.8 + t * 1.5; // spreads as it fades
      const startAngle = p.angle - arcLen / 2;
      const endAngle = p.angle + arcLen / 2;

      // Bright arc
      ctx.strokeStyle = `rgba(200, 160, 255, ${alpha.toFixed(3)})`;
      ctx.lineWidth = 3 + (1 - t) * 4;
      ctx.beginPath();
      ctx.arc(cx, cy, vr, startAngle, endAngle);
      ctx.stroke();

      // Glow
      ctx.strokeStyle = `rgba(140, 80, 255, ${(alpha * 0.3).toFixed(3)})`;
      ctx.lineWidth = 12 + (1 - t) * 8;
      ctx.beginPath();
      ctx.arc(cx, cy, vr, startAngle, endAngle);
      ctx.stroke();

      // Rim light on portrait edge (where pulse passes behind shoulders)
      const rimAngle = p.angle;
      const rimX = cx + Math.cos(rimAngle) * vr * 0.65;
      const rimY = cy + Math.sin(rimAngle) * vr * 0.65;
      if (isOccluded(rimX, rimY)) {
        const rimGrad = ctx.createRadialGradient(rimX, rimY, 0, rimX, rimY, vr * 0.15);
        rimGrad.addColorStop(0, `rgba(160, 120, 255, ${(alpha * 0.25).toFixed(3)})`);
        rimGrad.addColorStop(1, "rgba(120, 60, 255, 0)");
        ctx.fillStyle = rimGrad;
        ctx.fillRect(rimX - vr * 0.2, rimY - vr * 0.2, vr * 0.4, vr * 0.4);
      }
    }

    function drawEyeGlow(ex: number, ey: number, intensity: number) {
      const r = Math.min(w, h) * 0.06 * (0.6 + intensity * 0.8);
      const a = 0.08 + intensity * 0.25;
      const g1 = ctx.createRadialGradient(ex, ey, 0, ex, ey, r * 2.5);
      g1.addColorStop(0, `rgba(180, 140, 255, ${(a * 0.7).toFixed(3)})`);
      g1.addColorStop(0.3, `rgba(140, 80, 255, ${(a * 0.4).toFixed(3)})`);
      g1.addColorStop(1, "rgba(100, 50, 255, 0)");
      ctx.fillStyle = g1;
      ctx.fillRect(ex - r * 3, ey - r * 3, r * 6, r * 6);

      const g2 = ctx.createRadialGradient(ex, ey, 0, ex, ey, r);
      g2.addColorStop(0, `rgba(220, 200, 255, ${(a * 1.2).toFixed(3)})`);
      g2.addColorStop(0.5, `rgba(155, 92, 255, ${(a * 0.5).toFixed(3)})`);
      g2.addColorStop(1, "rgba(100, 50, 255, 0)");
      ctx.fillStyle = g2;
      ctx.beginPath();
      ctx.arc(ex, ey, r, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawFlare(ex: number, ey: number, intensity: number) {
      if (intensity < 0.4) return;
      const sw = w * 0.3 * intensity, sh = 2 + intensity * 3;
      const a = (intensity - 0.4) * 0.15;
      const g = ctx.createLinearGradient(ex - sw, ey, ex + sw, ey);
      g.addColorStop(0, "rgba(160, 120, 255, 0)");
      g.addColorStop(0.3, `rgba(180, 160, 255, ${a.toFixed(3)})`);
      g.addColorStop(0.5, `rgba(220, 200, 255, ${(a * 1.5).toFixed(3)})`);
      g.addColorStop(0.7, `rgba(180, 160, 255, ${a.toFixed(3)})`);
      g.addColorStop(1, "rgba(160, 120, 255, 0)");
      ctx.fillStyle = g;
      ctx.fillRect(ex - sw, ey - sh / 2, sw * 2, sh);
    }

    function drawArc(points: Point[], width: number, alpha: number, core: boolean) {
      if (points.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
      if (core) { ctx.strokeStyle = `rgba(255,255,255,${(alpha * 0.9).toFixed(3)})`; ctx.lineWidth = width; ctx.stroke(); }
      ctx.strokeStyle = `rgba(160,80,255,${(alpha * 0.6).toFixed(3)})`; ctx.lineWidth = width * (core ? 3 : 2); ctx.stroke();
      ctx.strokeStyle = `rgba(120,60,255,${(alpha * 0.2).toFixed(3)})`; ctx.lineWidth = width * 6; ctx.stroke();
    }

    function drawGrain() {
      const gw = 128, gh = 128;
      if (!grainData || Math.random() < 0.08) {
        grainData = ctx.createImageData(gw, gh);
        const d = grainData.data;
        for (let i = 0; i < d.length; i += 4) { const v = Math.random() * 255; d[i] = v; d[i + 1] = v; d[i + 2] = v; d[i + 3] = 6; }
      }
      for (let gx = 0; gx < w; gx += gw) for (let gy = 0; gy < h; gy += gh) ctx.putImageData(grainData, gx * dpr, gy * dpr);
    }

    // ======== MAIN RENDER LOOP ========
    const tick = (now: number) => {
      frame = 0;
      if (!visible) return;

      const dt = Math.min(now - lastTime, 50);
      lastTime = now;
      const dtSec = dt / 1000;
      const state = stateRef.current;
      const proximity = state?.proximity ?? 0;
      elapsed += dtSec;

      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";

      const surgeScale = 1 + proximity * 1.5;
      advanceSurge(surge, dt * surgeScale);
      const intensity = Math.min(1, surge.intensity + proximity * 0.3);

      const vcx = w * VORTEX_CX, vcy = h * VORTEX_CY;
      const vr = vortexRadius;
      const proxySpeed = 1 + proximity * 0.3; // 30% speed boost on proximity

      // ===== 1. ENERGY RINGS (behind everything else) =====
      if (!reduced) {
        const ringCount = mobile ? 1 : 3;
        const ringRadii = [vr * 0.95, vr * 1.05, vr * 0.85];
        const ringThickness = [2.5, 1.8, 1.2];
        const ringAlphas = [0.35, 0.22, 0.18];
        const ringHues = [270, 260, 280]; // purple family

        for (let r = 0; r < ringCount; r++) {
          ringAngles[r] += ringSpeeds[r] * dtSec * proxySpeed;
          drawEnergyRing(ringAngles[r], ringRadii[r], ringThickness[r], ringAlphas[r] + intensity * 0.15, ringHues[r]);
        }
      } else {
        // Reduced motion: static ring glow
        ctx.strokeStyle = "rgba(140, 80, 255, 0.12)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(vcx, vcy, vr, 0, Math.PI * 2);
        ctx.stroke();
      }

      // ===== 2. CIRCUMFERENCE PULSES =====
      if (!reduced) {
        pulseTimer -= dt;
        if (pulseTimer <= 0) {
          pulseTimer = 4000 + Math.random() * 4000;
          pulses.push({
            angle: Math.random() * Math.PI * 2,
            speed: 1.2 + Math.random() * 0.8,
            life: 0,
            maxLife: 800 + Math.random() * 600,
          });
          if (pulses.length > 3) pulses.shift();
        }
        for (let i = pulses.length - 1; i >= 0; i--) {
          const p = pulses[i];
          p.life += dt;
          p.angle += p.speed * dtSec * proxySpeed;
          if (p.life > p.maxLife) { pulses.splice(i, 1); continue; }
          drawPulse(p, vcx, vcy, vr);
        }
      }

      // ===== 3. ORBITAL SPARKS =====
      if (!reduced) {
        for (const s of sparks) {
          s.angle += s.speed * dtSec * proxySpeed;
          s.life += dt;
          if (s.life > s.maxLife) { Object.assign(s, spawnSpark(vr)); continue; }
          drawSpark(s, vcx, vcy, proximity);
        }
      }

      // ===== 4. EYE GLOW + LIGHTNING =====
      const lx = LEFT_EYE.x * w, ly = LEFT_EYE.y * h;
      const rx = RIGHT_EYE.x * w, ry = RIGHT_EYE.y * h;
      drawEyeGlow(lx, ly, intensity);
      drawEyeGlow(rx, ry, intensity);

      if (!reduced) {
        arcTimer -= dt;
        const arcInterval = intensity > 0.5 ? 60 + Math.random() * 100 : 200 + Math.random() * 400;
        if (arcTimer <= 0 && intensity > 0.15) {
          arcTimer = arcInterval;
          const eye = Math.random() < 0.5 ? { x: lx, y: ly } : { x: rx, y: ry };
          const reach = (30 + intensity * 80 + Math.random() * 40) * (w / 500);
          const angle = Math.random() * Math.PI * 2;
          const end = { x: eye.x + Math.cos(angle) * reach, y: eye.y + Math.sin(angle) * reach };
          arcs.push({ points: generateArc(eye, end, reach * 0.4), life: 0, maxLife: 60 + Math.random() * 120, width: 0.5 + intensity * 1.5, fork: Math.random() < 0.3 && intensity > 0.5 });
          while (arcs.length > maxArcs) arcs.shift();
        }
        for (let i = arcs.length - 1; i >= 0; i--) {
          const arc = arcs[i];
          arc.life += dt;
          if (arc.life > arc.maxLife) { arcs.splice(i, 1); continue; }
          const fade = 1 - arc.life / arc.maxLife;
          const flicker = Math.random() > 0.15 ? 1 : 0.1;
          drawArc(arc.points, arc.width, fade * flicker, true);
          if (arc.fork && arc.points.length > 4) {
            const bs = arc.points[Math.floor(arc.points.length * 0.4)];
            const ba = Math.random() * Math.PI * 2, bl = 15 + Math.random() * 30;
            drawArc(generateArc(bs, { x: bs.x + Math.cos(ba) * bl, y: bs.y + Math.sin(ba) * bl }, bl * 0.3), arc.width * 0.6, fade * flicker * 0.5, false);
          }
        }
      }

      // ===== 5. ANAMORPHIC FLARES =====
      if (!reduced) {
        drawFlare(lx, ly, intensity);
        drawFlare(rx, ry, intensity);
      }

      // ===== 6. EMBERS =====
      if (!reduced) {
        for (const e of embers) {
          e.life++;
          if (e.life > e.maxLife) { spawnEmber(e); continue; }
          e.x += e.vx; e.y += e.vy; e.vy -= 0.003;
          const fade = Math.sin((e.life / e.maxLife) * Math.PI);
          ctx.fillStyle = Math.random() < 0.3 ? `rgba(103,239,255,${(fade * 0.5).toFixed(3)})` : `rgba(200,130,255,${(fade * 0.5).toFixed(3)})`;
          ctx.beginPath(); ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2); ctx.fill();
        }
      }

      // ===== 7. FILM GRAIN =====
      if (!reduced && !mobile) { ctx.globalCompositeOperation = "source-over"; drawGrain(); }

      // ===== 8. VIGNETTE =====
      ctx.globalCompositeOperation = "source-over";
      const vig = ctx.createRadialGradient(w * 0.5, h * 0.45, w * 0.2, w * 0.5, h * 0.5, w * 0.7);
      vig.addColorStop(0, "rgba(0,0,0,0)");
      vig.addColorStop(1, "rgba(2,1,8,0.35)");
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, w, h);

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => { if (frame) cancelAnimationFrame(frame); ro.disconnect(); io.disconnect(); };
  }, [fxOn, stateRef]);

  return <canvas ref={canvasRef} className="living-portrait-canvas" aria-hidden="true" />;
}
