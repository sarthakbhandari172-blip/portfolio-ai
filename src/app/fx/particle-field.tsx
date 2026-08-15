"use client";

import { useEffect, useRef } from "react";
import { isMobileViewport, prefersReducedMotion, useFxEnabled } from "@/app/fx/fx";

type Spark = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  cyan: boolean;
};

const COUNT = 64;
const MAX_BITMAP_DIMENSION = 2048;

// Electric spark field behind the hero portrait. rAF-driven, DPR-capped,
// pauses off-screen, disabled on mobile / reduced motion / data-fx="off".
export function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fxOn = useFxEnabled();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !fxOn || prefersReducedMotion() || isMobileViewport()) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    let width = 0;
    let height = 0;
    let frame = 0;
    let visible = true;
    const mouse = { x: -9999, y: -9999 };
    const sparks: Spark[] = [];

    const spawn = (spark?: Spark): Spark => {
      const next: Spark = spark ?? {
        x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 0, size: 0, cyan: false,
      };
      next.x = Math.random() * width;
      next.y = Math.random() * height;
      next.vx = (Math.random() - 0.5) * 0.35;
      next.vy = -0.25 - Math.random() * 0.5;
      next.maxLife = 140 + Math.random() * 160;
      next.life = spark ? 0 : Math.random() * next.maxLife;
      next.size = 0.8 + Math.random() * 1.6;
      next.cyan = Math.random() < 0.3;
      return next;
    };

    const resize = () => {
      // Measure the explicit CSS box, not the transformed/intrinsic canvas.
      // Reading getBoundingClientRect() and then writing canvas.width caused a
      // ResizeObserver feedback loop on Retina screens until the bitmap grew
      // into a failed, white compositor surface.
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      if (width <= 0 || height <= 0) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const bitmapWidth = Math.min(MAX_BITMAP_DIMENSION, Math.round(width * dpr));
      const bitmapHeight = Math.min(MAX_BITMAP_DIMENSION, Math.round(height * dpr));
      if (canvas.width !== bitmapWidth || canvas.height !== bitmapHeight) {
        canvas.width = bitmapWidth;
        canvas.height = bitmapHeight;
      }
      context.setTransform(bitmapWidth / width, 0, 0, bitmapHeight / height, 0, 0);
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas.parentElement ?? canvas);

    for (let i = 0; i < COUNT; i += 1) sparks.push(spawn());

    const onPointerMove = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect();
      mouse.x = event.clientX - bounds.left;
      mouse.y = event.clientY - bounds.top;
    };
    const onPointerLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerout", onPointerLeave, { passive: true });

    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !frame) frame = window.requestAnimationFrame(tick);
    });
    intersection.observe(canvas);

    const tick = () => {
      frame = 0;
      if (!visible) return;
      context.clearRect(0, 0, width, height);
      context.globalCompositeOperation = "lighter";

      for (const spark of sparks) {
        // mouse repulsion — sparks arc away from the cursor
        const dx = spark.x - mouse.x;
        const dy = spark.y - mouse.y;
        const distSq = dx * dx + dy * dy;
        if (distSq < 150 * 150 && distSq > 1) {
          const dist = Math.sqrt(distSq);
          const force = ((150 - dist) / 150) * 0.55;
          spark.vx += (dx / dist) * force;
          spark.vy += (dy / dist) * force;
        }

        spark.vx += (Math.random() - 0.5) * 0.06;
        spark.vy += (Math.random() - 0.5) * 0.04 - 0.004;
        spark.vx *= 0.96;
        spark.vy *= 0.96;
        spark.x += spark.vx;
        spark.y += spark.vy;
        spark.life += 1;

        if (
          spark.life > spark.maxLife ||
          spark.x < -20 || spark.x > width + 20 ||
          spark.y < -20 || spark.y > height + 20
        ) {
          spawn(spark);
          continue;
        }

        const fade = Math.sin((spark.life / spark.maxLife) * Math.PI);
        const flicker = 0.55 + Math.random() * 0.45;
        const alpha = fade * flicker;
        context.strokeStyle = spark.cyan
          ? `rgba(103, 239, 255, ${(alpha * 0.8).toFixed(3)})`
          : `rgba(155, 92, 255, ${alpha.toFixed(3)})`;
        context.lineWidth = spark.size;
        context.beginPath();
        context.moveTo(spark.x, spark.y);
        context.lineTo(spark.x - spark.vx * 6, spark.y - spark.vy * 6);
        context.stroke();
      }

      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersection.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerout", onPointerLeave);
      context.clearRect(0, 0, width, height);
    };
  }, [fxOn]);

  return <canvas ref={canvasRef} className="deck-spark-field" aria-hidden="true" />;
}
