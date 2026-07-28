"use client";

import { useEffect } from "react";

const revealSelector = [
  ".hybrid-ui > .section > .section-heading",
  ".hybrid-ui .about-grid > *",
  ".hybrid-ui .project-card",
  ".hybrid-ui .service-card",
  ".hybrid-ui .timeline article",
  ".hybrid-ui .skill-card",
  ".hybrid-ui .contact-copy",
  ".hybrid-ui .contact-form",
].join(", ");

const panelSelector = [
  ".hybrid-ui .project-card",
].join(", ");

export function ScrollMotion() {
  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches) return;

    const root = document.documentElement;
    const targets = Array.from(document.querySelectorAll<HTMLElement>(revealSelector));
    const groupIndexes = new Map<Element, number>();
    const animationEndHandlers = new Map<HTMLElement, (event: AnimationEvent) => void>();
    let previousScrollY = window.scrollY;
    let scrollDirection: "down" | "up" = "down";

    const trackScrollDirection = () => {
      const nextScrollY = window.scrollY;
      const delta = nextScrollY - previousScrollY;

      if (Math.abs(delta) > 2) {
        scrollDirection = delta > 0 ? "down" : "up";
        previousScrollY = nextScrollY;
      }
    };

    window.addEventListener("scroll", trackScrollDirection, { passive: true });

    targets.forEach((target) => {
      const parent = target.parentElement;
      const index = parent ? groupIndexes.get(parent) ?? 0 : 0;
      if (parent) groupIndexes.set(parent, index + 1);

      let phase = "lift";

      if (target.matches(".section-heading")) {
        phase = "heading";
      } else if (target.matches(".about-grid > :first-child, .contact-copy")) {
        phase = "side-left";
      } else if (target.matches(".about-grid > :last-child, .contact-form")) {
        phase = "side-right";
      } else if (target.matches(".project-card")) {
        phase = index % 2 === 0 ? "wipe-left" : "wipe-right";
      } else if (target.matches(".service-card, .timeline article")) {
        phase = index % 2 === 0 ? "side-left" : "side-right";
      } else if (target.matches(".skill-card")) {
        phase = "lift";
      }

      target.classList.add("scroll-phase-target");
      target.dataset.phaseReveal = phase;
      target.dataset.phaseDirection = "down";
      target.style.setProperty(
        "--phase-delay",
        `${target.matches(".service-card, .timeline article, .skill-card") ? Math.min(index, 3) * 32 : 0}ms`,
      );

      const handleAnimationEnd = (event: AnimationEvent) => {
        if (event.target !== target) return;
        if (!event.animationName.startsWith("phase-lock-")) return;
        target.classList.add("phase-complete");
      };

      target.addEventListener("animationend", handleAnimationEnd);
      animationEndHandlers.set(target, handleAnimationEnd);

      if (target.matches(panelSelector)) {
        const shutter = document.createElement("span");
        shutter.className = "scroll-phase-shutter";
        shutter.setAttribute("aria-hidden", "true");

        const scan = document.createElement("span");
        scan.className = "scroll-phase-scan";
        scan.setAttribute("aria-hidden", "true");
        target.append(shutter, scan);
      }
    });

    root.classList.add("scroll-motion-ready");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const target = entry.target as HTMLElement;

          if (entry.isIntersecting && entry.intersectionRatio >= 0.06) {
            if (target.classList.contains("is-settled")) return;
            target.dataset.phaseDirection = scrollDirection;
            target.classList.remove("phase-complete");
            target.classList.add("is-settled");
            return;
          }

          if (!entry.isIntersecting) {
            target.classList.remove("is-settled", "phase-complete");
          }
        });
      },
      {
        threshold: [0, 0.06],
        rootMargin: "0px 0px -2% 0px",
      },
    );

    targets.forEach((target) => observer.observe(target));

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", trackScrollDirection);
      root.classList.remove("scroll-motion-ready");
      targets.forEach((target) => {
        const handleAnimationEnd = animationEndHandlers.get(target);
        if (handleAnimationEnd) target.removeEventListener("animationend", handleAnimationEnd);
        target.classList.remove("scroll-phase-target", "is-settled", "phase-complete");
        target.style.removeProperty("--phase-delay");
        delete target.dataset.phaseReveal;
        delete target.dataset.phaseDirection;
        target.querySelector(":scope > .scroll-phase-shutter")?.remove();
        target.querySelector(":scope > .scroll-phase-scan")?.remove();
      });
    };
  }, []);

  return null;
}
