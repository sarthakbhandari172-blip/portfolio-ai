"use client";

import { useEffect } from "react";
import { isMobileViewport, prefersReducedMotion, useFxEnabled } from "@/app/fx/fx";

const CARD_SELECTOR = ".hybrid-ui .project-card, .hybrid-ui .service-card, .hybrid-ui .skill-card";
const MAX_TILT = 5; // degrees

// Delegated 3D tilt + sheen tracking for work/service/skill cards.
// Injects a .card-holo layer (sheen + perimeter glow live in CSS).
export function CardTilt() {
  const fxOn = useFxEnabled();

  useEffect(() => {
    if (!fxOn || prefersReducedMotion() || isMobileViewport()) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const cards = Array.from(document.querySelectorAll<HTMLElement>(CARD_SELECTOR));
    const holos: HTMLElement[] = [];
    cards.forEach((card) => {
      const holo = document.createElement("span");
      holo.className = "card-holo";
      holo.setAttribute("aria-hidden", "true");
      card.appendChild(holo);
      holos.push(holo);
    });

    let card: HTMLElement | null = null;
    let frame = 0;
    const target = { rx: 0, ry: 0 };
    const current = { rx: 0, ry: 0 };

    const tick = () => {
      frame = 0;
      if (!card) return;
      current.rx += (target.rx - current.rx) * 0.16;
      current.ry += (target.ry - current.ry) * 0.16;
      card.style.setProperty("--card-rx", `${current.rx.toFixed(2)}deg`);
      card.style.setProperty("--card-ry", `${current.ry.toFixed(2)}deg`);
      if (Math.abs(current.rx - target.rx) + Math.abs(current.ry - target.ry) > 0.01) {
        frame = window.requestAnimationFrame(tick);
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      const element = event.target instanceof Element ? event.target : null;
      const next = element?.closest<HTMLElement>(CARD_SELECTOR) ?? null;

      if (next !== card) {
        if (card) {
          card.style.setProperty("--card-rx", "0deg");
          card.style.setProperty("--card-ry", "0deg");
        }
        card = next;
        current.rx = 0;
        current.ry = 0;
      }
      if (!card) return;

      const bounds = card.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width;
      const y = (event.clientY - bounds.top) / bounds.height;
      target.rx = (0.5 - y) * MAX_TILT * 2;
      target.ry = (x - 0.5) * MAX_TILT * 2;
      card.style.setProperty("--sheen-x", `${(x * 100).toFixed(1)}%`);
      card.style.setProperty("--sheen-y", `${(y * 100).toFixed(1)}%`);
      if (!frame) frame = window.requestAnimationFrame(tick);
    };

    document.addEventListener("pointermove", onPointerMove, { passive: true });

    return () => {
      document.removeEventListener("pointermove", onPointerMove);
      if (frame) window.cancelAnimationFrame(frame);
      holos.forEach((holo) => holo.remove());
      cards.forEach((element) => {
        element.style.removeProperty("--card-rx");
        element.style.removeProperty("--card-ry");
        element.style.removeProperty("--sheen-x");
        element.style.removeProperty("--sheen-y");
      });
    };
  }, [fxOn]);

  return null;
}
