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

export function ScrollMotion() {
  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches) return;

    const root = document.documentElement;
    const targets = Array.from(document.querySelectorAll<HTMLElement>(revealSelector));
    const groupIndexes = new Map<Element, number>();

    targets.forEach((target) => {
      const parent = target.parentElement;
      const index = parent ? groupIndexes.get(parent) ?? 0 : 0;
      if (parent) groupIndexes.set(parent, index + 1);

      target.classList.add("scroll-fall-target");
      target.style.setProperty("--reveal-delay", `${Math.min(index, 5) * 70}ms`);
      target.style.setProperty("--fall-tilt", `${index % 2 === 0 ? -0.55 : 0.55}deg`);
    });

    root.classList.add("scroll-motion-ready");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-settled");
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -8% 0px",
      },
    );

    targets.forEach((target) => observer.observe(target));

    return () => {
      observer.disconnect();
      root.classList.remove("scroll-motion-ready");
      targets.forEach((target) => {
        target.classList.remove("scroll-fall-target", "is-settled");
        target.style.removeProperty("--reveal-delay");
        target.style.removeProperty("--fall-tilt");
      });
    };
  }, []);

  return null;
}
