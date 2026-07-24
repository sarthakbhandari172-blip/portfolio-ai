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
    let frame = 0;

    const interactiveSelector =
      'a, button, [role="button"], .project-card, .service-card, .skill-card, .character-deck';
    const typingSelector = "input, textarea, select, option";

    const onPointerMove = (event: PointerEvent) => {
      targetX = event.clientX;
      targetY = event.clientY;
      cursor.style.setProperty("--cursor-dot-x", `${targetX}px`);
      cursor.style.setProperty("--cursor-dot-y", `${targetY}px`);
      cursor.classList.add("is-visible");

      const target = event.target instanceof Element ? event.target : null;
      cursor.classList.toggle("is-hovering", Boolean(target?.closest(interactiveSelector)));
      cursor.classList.toggle("is-typing", Boolean(target?.closest(typingSelector)));
      cursor.classList.toggle(
        "is-inspecting",
        Boolean(target?.closest('[data-cursor="inspect"]')),
      );
    };

    const onPointerDown = () => cursor.classList.add("is-active");
    const onPointerUp = () => cursor.classList.remove("is-active");
    const onPointerLeave = () => cursor.classList.remove("is-visible");
    const onPointerEnter = () => cursor.classList.add("is-visible");
    const animate = () => {
      currentX += (targetX - currentX) * 0.22;
      currentY += (targetY - currentY) * 0.22;
      cursor.style.setProperty("--cursor-ring-x", `${currentX}px`);
      cursor.style.setProperty("--cursor-ring-y", `${currentY}px`);
      frame = window.requestAnimationFrame(animate);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    document.documentElement.addEventListener("mouseleave", onPointerLeave);
    document.documentElement.addEventListener("mouseenter", onPointerEnter);
    frame = window.requestAnimationFrame(animate);

    return () => {
      document.documentElement.classList.remove("interface-cursor-ready");
      window.cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      document.documentElement.removeEventListener("mouseleave", onPointerLeave);
      document.documentElement.removeEventListener("mouseenter", onPointerEnter);
    };
  }, []);

  return (
    <div className="interface-cursor" ref={cursorRef} aria-hidden="true">
      <span className="interface-cursor__trail" />
      <span className="interface-cursor__ring">
        <i />
        <b />
      </span>
      <span className="interface-cursor__dot" />
    </div>
  );
}
