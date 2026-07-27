"use client";

import { useEffect, useRef } from "react";

export function InterfaceCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!cursor || !finePointer.matches || reducedMotion.matches) return;

    document.documentElement.classList.add("interface-cursor-ready");

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;
    let previousX = targetX;
    let previousY = targetY;
    let targetSpeed = 0;
    let currentSpeed = 0;
    let lastTarget: EventTarget | null = null;
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
      targetSpeed = Math.min(Math.hypot(deltaX, deltaY) / 28, 1);
      previousX = targetX;
      previousY = targetY;
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
    const animate = () => {
      currentX += (targetX - currentX) * 0.82;
      currentY += (targetY - currentY) * 0.82;
      currentSpeed += (targetSpeed - currentSpeed) * 0.44;
      targetSpeed *= 0.78;
      cursor.style.setProperty("--cursor-ring-x", `${currentX}px`);
      cursor.style.setProperty("--cursor-ring-y", `${currentY}px`);
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
