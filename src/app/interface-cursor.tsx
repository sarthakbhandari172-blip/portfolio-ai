"use client";

import { useEffect, useRef } from "react";
import { useFxEnabled } from "@/app/fx/fx";

// Small interactive elements pull the reticle toward their center.
const MAGNET_MAX_WIDTH = 280;
const MAGNET_MAX_HEIGHT = 130;
const MAGNET_STRENGTH = 0.34;

export function InterfaceCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const fxOn = useFxEnabled();

  useEffect(() => {
    const cursor = cursorRef.current;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!cursor || !fxOn || !finePointer.matches || reducedMotion.matches) return;

    document.documentElement.classList.add("interface-cursor-ready");

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;
    let previousX = targetX;
    let previousY = targetY;
    let previousPointerTime = performance.now();
    let previousFrameTime = performance.now();
    let targetSpeed = 0;
    let currentSpeed = 0;
    let lastTarget: EventTarget | null = null;
    let magnetElement: Element | null = null;
    let frame = 0;
    let scrollTimer = 0;

    const interactiveSelector =
      'a, button, [role="button"], .project-card, .service-card, .skill-card, .character-deck';
    const typingSelector = "input, textarea, select, option";

    const onPointerMove = (event: PointerEvent) => {
      targetX = event.clientX;
      targetY = event.clientY;
      const deltaX = targetX - previousX;
      const deltaY = targetY - previousY;
      const pointerDelta = Math.max(event.timeStamp - previousPointerTime, 4);
      targetSpeed = Math.min(Math.hypot(deltaX, deltaY) / pointerDelta / 1.25, 1);
      previousX = targetX;
      previousY = targetY;
      previousPointerTime = event.timeStamp;
      cursor.style.setProperty("--cursor-dot-x", `${targetX}px`);
      cursor.style.setProperty("--cursor-dot-y", `${targetY}px`);
      cursor.classList.add("is-visible");

      if (event.target !== lastTarget) {
        lastTarget = event.target;
        const target = event.target instanceof Element ? event.target : null;
        const interactive = target?.closest(interactiveSelector) ?? null;
        cursor.classList.toggle("is-hovering", Boolean(interactive));
        cursor.classList.toggle("is-typing", Boolean(target?.closest(typingSelector)));

        // Magnetize only compact controls (buttons, links), never large cards.
        magnetElement = null;
        if (interactive) {
          const bounds = interactive.getBoundingClientRect();
          if (bounds.width <= MAGNET_MAX_WIDTH && bounds.height <= MAGNET_MAX_HEIGHT) {
            magnetElement = interactive;
          }
        }
        cursor.classList.toggle("is-locked", Boolean(magnetElement));
        cursor.classList.toggle(
          "is-inspecting",
          Boolean(target?.closest('[data-cursor="inspect"]')),
        );
      }
    };

    const onPointerDown = () => cursor.classList.add("is-active");
    const onPointerUp = () => cursor.classList.remove("is-active");
    const onPointerLeave = () => cursor.classList.remove("is-visible");
    const onPointerEnter = () => cursor.classList.add("is-visible");
    const onScroll = () => {
      cursor.classList.add("is-processing");
      window.clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(() => {
        cursor.classList.remove("is-processing");
      }, 300);
    };
    const animate = (time: number) => {
      const delta = Math.min(Math.max(time - previousFrameTime, 0), 32);
      const positionBlend = 1 - Math.exp(-delta / 13.5);
      const speedBlend = 1 - Math.exp(-delta / 38);
      const speedDecay = Math.exp(-delta / 54);
      previousFrameTime = time;

      let ringTargetX = targetX;
      let ringTargetY = targetY;
      if (magnetElement) {
        if (magnetElement.isConnected) {
          const bounds = magnetElement.getBoundingClientRect();
          ringTargetX += (bounds.left + bounds.width / 2 - targetX) * MAGNET_STRENGTH;
          ringTargetY += (bounds.top + bounds.height / 2 - targetY) * MAGNET_STRENGTH;
        } else {
          magnetElement = null;
          cursor.classList.remove("is-locked");
        }
      }

      currentX += (ringTargetX - currentX) * positionBlend;
      currentY += (ringTargetY - currentY) * positionBlend;
      currentSpeed += (targetSpeed - currentSpeed) * speedBlend;
      targetSpeed *= speedDecay;
      cursor.style.setProperty("--cursor-ring-x", `${currentX.toFixed(2)}px`);
      cursor.style.setProperty("--cursor-ring-y", `${currentY.toFixed(2)}px`);
      cursor.style.setProperty("--cursor-speed", currentSpeed.toFixed(3));
      frame = window.requestAnimationFrame(animate);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    document.documentElement.addEventListener("mouseleave", onPointerLeave);
    document.documentElement.addEventListener("mouseenter", onPointerEnter);
    frame = window.requestAnimationFrame(animate);

    return () => {
      document.documentElement.classList.remove("interface-cursor-ready");
      window.cancelAnimationFrame(frame);
      window.clearTimeout(scrollTimer);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("scroll", onScroll);
      document.documentElement.removeEventListener("mouseleave", onPointerLeave);
      document.documentElement.removeEventListener("mouseenter", onPointerEnter);
      cursor.classList.remove("is-visible", "is-hovering", "is-locked", "is-typing");
    };
  }, [fxOn]);

  return (
    <div className="interface-cursor" ref={cursorRef} aria-hidden="true">
      <span className="interface-cursor__ring">
        <i />
        <b />
      </span>
      <span className="interface-cursor__brackets">
        <i />
        <i />
        <i />
        <i />
      </span>
      <span className="interface-cursor__dot" />
      <span className="interface-cursor__status">PROCESSING</span>
    </div>
  );
}
