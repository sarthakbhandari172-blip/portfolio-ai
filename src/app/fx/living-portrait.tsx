"use client";

import { useEffect, useRef } from "react";
import { isMobileViewport, prefersReducedMotion, useFxEnabled } from "@/app/fx/fx";

// Eye positions as fractions of the portrait frame (measured from the actual image)
const LEFT_EYE = { x: 0.42, y: 0.30 };
const RIGHT_EYE = { x: 0.56, y: 0.31 };

// --- Lightning arc via midpoint displacement ---
type Point = { x: number; y: number };

function buildArc(
  start: Point,
  end: Point,
  displacement: number,
  depth: number,
  points: Point[],
) {
  if (depth <= 0) {
    points.push(end);
    return;
  }
  const mid: Point = {
    x: (start.x + end.x) / 2 + (Math.random() - 0.5) * displacement,
    y: (start.y + end.y) / 2 + (Math.random() - 0.5) * displacement,
  };
  buildArc(start, mid, displacement * 0.52, depth - 1, points);
  buildArc(mid, end, displacement * 0.52, depth - 1, points);
}

function generateArc(start: Point, end: Point, spread: number): Point[] {
  const points: Point[] = [start];
  buildArc(start, end, spread, 5, points);
  return points;
}

// --- Surge timing ---
type SurgeState = {
  phase: "idle" | "building" | "peak" | "decay";
  timer: number;
  intensity: number; // 0..1
  nextSurge: number;
};

function advanceSurge(s: SurgeState, dt: number): void {
  s.timer -= dt;
  if (s.timer <= 0) {
    switch (s.phase) {
      case "idle":
        s.phase = "building";
        s.timer = 200 + Math.random() * 300;
        break;
      case "building":
        s.phase = "peak";
        s.timer = 80 + Math.random() * 180;
        break;
      case "peak":
        s.phase = "decay";
        s.timer = 300 + Math.random() * 500;
        break;
      case "decay":
        s.phase = "idle";
        s.timer = s.nextSurge;
        s.nextSurge = 1800 + Math.random() * 4000;
        break;
    }
  }
  const targets: Record<string, number> = {
    idle: 0.12,
    building: 0.55,
    peak: 1.0,
    decay: 0.2,
  };
  const target = targets[s.phase];
  const rate = s.phase === "peak" ? 0.15 : 0.04;
  s.intensity += (target - s.intensity) * rate;
}

// --- Main component ---
export type LivingPortraitState = {
  proximity: number; // 0..1 — how close the cursor is to the card
  hovering: boolean;
};

export function LivingPortrait({
  stateRef,
}: {
  stateRef: React.RefObject<LivingPortraitState>;
}) {
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
    let w = 0;
    let h = 0;
    let frame = 0;
    let visible = true;
    let lastTime = performance.now();

    // Surge state
    const surge: SurgeState = {
      phase: "idle",
      timer: 800 + Math.random() * 2000,
      intensity: 0.12,
      nextSurge: 2000 + Math.random() * 3000,
    };

    // Arc pool — reuse objects
    const maxArcs = mobile ? 3 : 6;
    const arcs: { points: Point[]; life: number; maxLife: number; width: number; fork: boolean }[] = [];
    let arcTimer = 0;

    // Film grain buffer
    let grainData: ImageData | null = null;

    // Ember pool
    const emberCount = mobile ? 8 : 18;
    const embers: { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; size: number }[] = [];
    for (let i = 0; i < emberCount; i++) {
      embers.push({ x: 0, y: 0, vx: 0, vy: 0, life: 9999, maxLife: 100, size: 1 });
    }

    function spawnEmber(e: typeof embers[0]) {
      // Embers spawn near the vortex ring area (center of frame)
      const angle = Math.random() * Math.PI * 2;
      const radius = (0.2 + Math.random() * 0.25) * Math.min(w, h);
      e.x = w * 0.5 + Math.cos(angle) * radius;
      e.y = h * 0.45 + Math.sin(angle) * radius;
      e.vx = (Math.random() - 0.5) * 0.3;
      e.vy = -0.4 - Math.random() * 0.8;
      e.life = 0;
      e.maxLife = 120 + Math.random() * 180;
      e.size = 0.6 + Math.random() * 1.4;
    }

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      w = bounds.width;
      h = bounds.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      grainData = null; // regenerate
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !frame) frame = requestAnimationFrame(tick);
    });
    io.observe(canvas);

    function drawArc(points: Point[], width: number, alpha: number, core: boolean) {
      if (points.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      if (core) {
        ctx.strokeStyle = `rgba(255, 255, 255, ${(alpha * 0.9).toFixed(3)})`;
        ctx.lineWidth = width;
        ctx.stroke();
      }
      // Corona
      ctx.strokeStyle = `rgba(160, 80, 255, ${(alpha * 0.6).toFixed(3)})`;
      ctx.lineWidth = width * (core ? 3 : 2);
      ctx.stroke();
      // Outer glow
      ctx.strokeStyle = `rgba(120, 60, 255, ${(alpha * 0.2).toFixed(3)})`;
      ctx.lineWidth = width * 6;
      ctx.stroke();
    }

    function drawEyeGlow(ex: number, ey: number, intensity: number) {
      const baseRadius = Math.min(w, h) * 0.06;
      const radius = baseRadius * (0.6 + intensity * 0.8);
      const alpha = 0.08 + intensity * 0.25;

      // Radial spill on face
      const grad = ctx.createRadialGradient(ex, ey, 0, ex, ey, radius * 2.5);
      grad.addColorStop(0, `rgba(180, 140, 255, ${(alpha * 0.7).toFixed(3)})`);
      grad.addColorStop(0.3, `rgba(140, 80, 255, ${(alpha * 0.4).toFixed(3)})`);
      grad.addColorStop(1, "rgba(100, 50, 255, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(ex - radius * 3, ey - radius * 3, radius * 6, radius * 6);

      // Core glow
      const coreGrad = ctx.createRadialGradient(ex, ey, 0, ex, ey, radius);
      coreGrad.addColorStop(0, `rgba(220, 200, 255, ${(alpha * 1.2).toFixed(3)})`);
      coreGrad.addColorStop(0.5, `rgba(155, 92, 255, ${(alpha * 0.5).toFixed(3)})`);
      coreGrad.addColorStop(1, "rgba(100, 50, 255, 0)");
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(ex, ey, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawFlare(ex: number, ey: number, intensity: number) {
      if (intensity < 0.4) return;
      // Anamorphic horizontal streak
      const streakW = w * 0.3 * intensity;
      const streakH = 2 + intensity * 3;
      const alpha = (intensity - 0.4) * 0.15;
      const grad = ctx.createLinearGradient(ex - streakW, ey, ex + streakW, ey);
      grad.addColorStop(0, "rgba(160, 120, 255, 0)");
      grad.addColorStop(0.3, `rgba(180, 160, 255, ${alpha.toFixed(3)})`);
      grad.addColorStop(0.5, `rgba(220, 200, 255, ${(alpha * 1.5).toFixed(3)})`);
      grad.addColorStop(0.7, `rgba(180, 160, 255, ${alpha.toFixed(3)})`);
      grad.addColorStop(1, "rgba(160, 120, 255, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(ex - streakW, ey - streakH / 2, streakW * 2, streakH);
    }

    function drawGrain() {
      if (reduced) return;
      // Low-cost grain: generate small noise, tile
      const gw = 128;
      const gh = 128;
      if (!grainData || Math.random() < 0.08) {
        grainData = ctx.createImageData(gw, gh);
        const d = grainData.data;
        for (let i = 0; i < d.length; i += 4) {
          const v = Math.random() * 255;
          d[i] = v;
          d[i + 1] = v;
          d[i + 2] = v;
          d[i + 3] = 6; // ~2.5% opacity
        }
      }
      ctx.globalAlpha = 1;
      // Tile grain across canvas
      for (let gx = 0; gx < w; gx += gw) {
        for (let gy = 0; gy < h; gy += gh) {
          ctx.putImageData(grainData, gx * dpr, gy * dpr);
        }
      }
    }

    const tick = (now: number) => {
      frame = 0;
      if (!visible) return;

      const dt = Math.min(now - lastTime, 50);
      lastTime = now;
      const state = stateRef.current;
      const proximity = state?.proximity ?? 0;

      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";

      // Advance surge state — proximity accelerates surges
      const surgeScale = 1 + proximity * 1.5;
      advanceSurge(surge, dt * surgeScale);
      const intensity = Math.min(1, surge.intensity + proximity * 0.3);

      // Eye positions in canvas coords
      const lx = LEFT_EYE.x * w;
      const ly = LEFT_EYE.y * h;
      const rx = RIGHT_EYE.x * w;
      const ry = RIGHT_EYE.y * h;

      // 1. Eye glow (always on, smoldering idle)
      drawEyeGlow(lx, ly, intensity);
      drawEyeGlow(rx, ry, intensity);

      // 2. Lightning arcs
      if (!reduced) {
        arcTimer -= dt;
        const arcInterval = intensity > 0.5
          ? 60 + Math.random() * 100
          : 200 + Math.random() * 400;
        if (arcTimer <= 0 && intensity > 0.15) {
          arcTimer = arcInterval;
          const fromLeft = Math.random() < 0.5;
          const eye = fromLeft ? { x: lx, y: ly } : { x: rx, y: ry };
          const reach = (30 + intensity * 80 + Math.random() * 40) * (w / 500);
          const angle = Math.random() * Math.PI * 2;
          const end: Point = {
            x: eye.x + Math.cos(angle) * reach,
            y: eye.y + Math.sin(angle) * reach,
          };
          const pts = generateArc(eye, end, reach * 0.4);
          arcs.push({
            points: pts,
            life: 0,
            maxLife: 60 + Math.random() * 120,
            width: 0.5 + intensity * 1.5,
            fork: Math.random() < 0.3 && intensity > 0.5,
          });
          // Trim pool
          while (arcs.length > maxArcs) arcs.shift();
        }

        for (let i = arcs.length - 1; i >= 0; i--) {
          const arc = arcs[i];
          arc.life += dt;
          if (arc.life > arc.maxLife) {
            arcs.splice(i, 1);
            continue;
          }
          const fade = 1 - arc.life / arc.maxLife;
          const flicker = Math.random() > 0.15 ? 1 : 0.1;
          drawArc(arc.points, arc.width, fade * flicker, true);

          // Fork
          if (arc.fork && arc.points.length > 4) {
            const branchStart = arc.points[Math.floor(arc.points.length * 0.4)];
            const branchAngle = Math.random() * Math.PI * 2;
            const branchLen = 15 + Math.random() * 30;
            const branchEnd: Point = {
              x: branchStart.x + Math.cos(branchAngle) * branchLen,
              y: branchStart.y + Math.sin(branchAngle) * branchLen,
            };
            const branchPts = generateArc(branchStart, branchEnd, branchLen * 0.3);
            drawArc(branchPts, arc.width * 0.6, fade * flicker * 0.5, false);
          }
        }
      }

      // 3. Anamorphic flare
      if (!reduced) {
        drawFlare(lx, ly, intensity);
        drawFlare(rx, ry, intensity);
      }

      // 4. Ambient embers (drift faster near vortex center)
      if (!reduced) {
        ctx.globalCompositeOperation = "lighter";
        for (const e of embers) {
          e.life++;
          if (e.life > e.maxLife) {
            spawnEmber(e);
            continue;
          }
          // Drift toward vortex center with upward bias
          e.x += e.vx;
          e.y += e.vy;
          e.vy -= 0.003; // gentle float up

          const fade = Math.sin((e.life / e.maxLife) * Math.PI);
          const alpha = fade * 0.5;
          ctx.fillStyle = Math.random() < 0.3
            ? `rgba(103, 239, 255, ${alpha.toFixed(3)})`
            : `rgba(200, 130, 255, ${alpha.toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 5. Film grain overlay
      if (!reduced && !mobile) {
        ctx.globalCompositeOperation = "source-over";
        drawGrain();
      }

      // 6. Vignette
      ctx.globalCompositeOperation = "source-over";
      const vignette = ctx.createRadialGradient(
        w * 0.5, h * 0.45, w * 0.2,
        w * 0.5, h * 0.5, w * 0.7,
      );
      vignette.addColorStop(0, "rgba(0,0,0,0)");
      vignette.addColorStop(1, "rgba(2,1,8,0.35)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, w, h);

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      ro.disconnect();
      io.disconnect();
    };
  }, [fxOn, stateRef]);

  return (
    <canvas
      ref={canvasRef}
      className="living-portrait-canvas"
      aria-hidden="true"
    />
  );
}
