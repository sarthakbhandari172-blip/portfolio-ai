"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion, useFxEnabled } from "@/app/fx/fx";

// HUD layer: faint scanlines, rare 1-frame CRT flicker, self-drawing corner
// brackets on sections, ticking status readout. Gated on data-fx + motion.
export function HudOverlay() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const readoutRef = useRef<HTMLDivElement>(null);
  const fxOn = useFxEnabled();

  useEffect(() => {
    const overlay = overlayRef.current;
    const readout = readoutRef.current;
    if (!overlay || !readout || !fxOn) return;
    const reduced = prefersReducedMotion();

    // Corner brackets injected into each section; drawn on viewport entry.
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>(".hybrid-ui > .section, .character-lobby"),
    );
    const injected: HTMLElement[] = [];
    sections.forEach((section) => {
      const corners = document.createElement("span");
      corners.className = "hud-corners";
      corners.setAttribute("aria-hidden", "true");
      for (let i = 0; i < 4; i += 1) corners.appendChild(document.createElement("i"));
      section.appendChild(corners);
      injected.push(corners);
    });

    let activeSection = "home";
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const corners = entry.target.querySelector(":scope > .hud-corners");
          if (entry.isIntersecting) {
            corners?.classList.add("hud-corners--drawn");
            if (entry.target.id) activeSection = entry.target.id;
          } else {
            corners?.classList.remove("hud-corners--drawn");
          }
        });
      },
      { threshold: 0.12 },
    );
    sections.forEach((section) => observer.observe(section));

    // Ticking status readout (4Hz — cheap, no layout thrash).
    const pointer = { x: 0, y: 0 };
    const onPointerMove = (event: PointerEvent) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    const tickReadout = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const depth = max > 0 ? Math.round((window.scrollY / max) * 100) : 0;
      readout.textContent = [
        "SYS.ONLINE",
        `SEC//${activeSection.toUpperCase()}`,
        `X:${String(pointer.x).padStart(4, "0")} Y:${String(pointer.y).padStart(4, "0")}`,
        `DEPTH ${String(depth).padStart(3, "0")}%`,
      ].join("  ·  ");
    };
    tickReadout();
    const readoutTimer = window.setInterval(tickReadout, 250);

    // Rare 1-frame CRT flicker (never under reduced motion).
    let flickerTimer = 0;
    let flickerOff = 0;
    const scheduleFlicker = () => {
      flickerTimer = window.setTimeout(() => {
        overlay.classList.add("hud-overlay--flicker");
        flickerOff = window.setTimeout(() => {
          overlay.classList.remove("hud-overlay--flicker");
          scheduleFlicker();
        }, 70);
      }, 9000 + Math.random() * 14000);
    };
    if (!reduced) scheduleFlicker();

    return () => {
      observer.disconnect();
      injected.forEach((corners) => corners.remove());
      window.removeEventListener("pointermove", onPointerMove);
      window.clearInterval(readoutTimer);
      window.clearTimeout(flickerTimer);
      window.clearTimeout(flickerOff);
      overlay.classList.remove("hud-overlay--flicker");
    };
  }, [fxOn]);

  return (
    <div className="hud-overlay" ref={overlayRef} aria-hidden="true">
      <span className="hud-overlay__scanlines" />
      <div className="hud-overlay__readout" ref={readoutRef} />
    </div>
  );
}
