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
  ".hybrid-ui .service-card",
  ".hybrid-ui .timeline article",
  ".hybrid-ui .skill-card",
  ".hybrid-ui .contact-form",
].join(", ");

export function ScrollMotion() {
  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches) return;

    const root = document.documentElement;
    const targets = Array.from(document.querySelectorAll<HTMLElement>(revealSelector));
    const groupIndexes = new Map<Element, number>();
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

      const phase = target.matches(".section-heading")
        ? "heading"
        : target.matches(panelSelector)
          ? "panel"
          : "copy";

      target.classList.add("scroll-phase-target");
      target.dataset.phaseReveal = phase;
      target.dataset.phaseDirection = "down";
      target.style.setProperty("--phase-delay", `${phase === "panel" ? Math.min(index, 3) * 45 : 0}ms`);

      if (phase === "panel") {
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
            target.classList.add("is-settled");
            return;
          }

          if (!entry.isIntersecting) {
            target.classList.remove("is-settled");
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
        target.classList.remove("scroll-phase-target", "is-settled");
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
