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

    targets.forEach((target) => {
      target.classList.add("scroll-fall-target");
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
        threshold: 0.01,
        rootMargin: "0px 0px 14% 0px",
      },
    );

    targets.forEach((target) => observer.observe(target));

    return () => {
      observer.disconnect();
      root.classList.remove("scroll-motion-ready");
      targets.forEach((target) => {
        target.classList.remove("scroll-fall-target", "is-settled");
      });
    };
  }, []);

  return null;
}
