"use client";

import { useEffect, useRef } from "react";

export function InterfaceCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!cursor) return;

    const root = document.documentElement;

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
    let frame = 0;
    let scrollTimer = 0;

    const interactiveSelector =
      'a, button, [role="button"], .project-card, .service-card, .skill-card, .character-deck';
    const typingSelector = "input, textarea, select, option";

    const onPointerMove = (event: PointerEvent) => {
      if (!cursorEnabled()) return;
      targetX = event.clientX;
      targetY = event.clientY;
      const deltaX = targetX - previousX;
      const deltaY = targetY - previousY;
      const pointerDelta = Math.min(Math.max(event.timeStamp - previousPointerTime, 4), 32);
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
        cursor.classList.toggle("is-hovering", Boolean(target?.closest(interactiveSelector)));
        cursor.classList.toggle("is-typing", Boolean(target?.closest(typingSelector)));
        cursor.classList.toggle(
          "is-inspecting",
          Boolean(target?.closest('[data-cursor="inspect"]')),
        );
      }

      requestFrame();
    };

    const onPointerDown = () => {
      if (cursorEnabled()) cursor.classList.add("is-active");
    };
    const onPointerUp = () => cursor.classList.remove("is-active");
    const onPointerLeave = () => cursor.classList.remove("is-visible");
    const onPointerEnter = () => {
      if (!cursorEnabled()) return;
      cursor.classList.add("is-visible");
      requestFrame();
    };
    const onScroll = () => {
      if (!cursorEnabled()) return;
      cursor.classList.add("is-processing");
      window.clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(() => {
        cursor.classList.remove("is-processing");
      }, 300);
    };

    function cursorEnabled() {
      return finePointer.matches && !reducedMotion.matches;
    }

    function requestFrame() {
      if (frame || document.hidden || !cursorEnabled()) return;
      previousFrameTime = performance.now();
      frame = window.requestAnimationFrame(animate);
    }

    const animate = (time: number) => {
      frame = 0;
      const delta = Math.min(Math.max(time - previousFrameTime, 0), 32);
      const positionBlend = 1 - Math.exp(-delta / 13.5);
      const speedBlend = 1 - Math.exp(-delta / 38);
      const speedDecay = Math.exp(-delta / 54);
      previousFrameTime = time;

      currentX += (targetX - currentX) * positionBlend;
      currentY += (targetY - currentY) * positionBlend;
      currentSpeed += (targetSpeed - currentSpeed) * speedBlend;
      targetSpeed *= speedDecay;
      const stillMoving =
        Math.abs(targetX - currentX) > 0.05 ||
        Math.abs(targetY - currentY) > 0.05 ||
        targetSpeed > 0.002 ||
        currentSpeed > 0.002;

      if (!stillMoving) {
        currentX = targetX;
        currentY = targetY;
        targetSpeed = 0;
        currentSpeed = 0;
      }

      cursor.style.setProperty("--cursor-ring-x", `${currentX.toFixed(2)}px`);
      cursor.style.setProperty("--cursor-ring-y", `${currentY.toFixed(2)}px`);
      cursor.style.setProperty("--cursor-speed", currentSpeed.toFixed(3));
      if (stillMoving) frame = window.requestAnimationFrame(animate);
    };

    const syncCursorAvailability = () => {
      const enabled = cursorEnabled();
      root.classList.toggle("interface-cursor-ready", enabled);

      if (!enabled) {
        window.cancelAnimationFrame(frame);
        window.clearTimeout(scrollTimer);
        frame = 0;
        cursor.classList.remove(
          "is-visible",
          "is-active",
          "is-hovering",
          "is-typing",
          "is-inspecting",
          "is-processing",
        );
      }
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        window.cancelAnimationFrame(frame);
        frame = 0;
        return;
      }

      if (cursor.classList.contains("is-visible")) requestFrame();
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    document.documentElement.addEventListener("mouseleave", onPointerLeave);
    document.documentElement.addEventListener("mouseenter", onPointerEnter);
    document.addEventListener("visibilitychange", onVisibilityChange);
    finePointer.addEventListener("change", syncCursorAvailability);
    reducedMotion.addEventListener("change", syncCursorAvailability);
    syncCursorAvailability();

    return () => {
      root.classList.remove("interface-cursor-ready");
      window.cancelAnimationFrame(frame);
      window.clearTimeout(scrollTimer);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("scroll", onScroll);
      document.documentElement.removeEventListener("mouseleave", onPointerLeave);
      document.documentElement.removeEventListener("mouseenter", onPointerEnter);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      finePointer.removeEventListener("change", syncCursorAvailability);
      reducedMotion.removeEventListener("change", syncCursorAvailability);
    };
  }, []);

  return (
    <div className="interface-cursor" ref={cursorRef} aria-hidden="true">
      <span className="interface-cursor__ring">
        <i />
        <b />
      </span>
      <span className="interface-cursor__dot" />
      <span className="interface-cursor__status">PROCESSING</span>
    </div>
  );
}
