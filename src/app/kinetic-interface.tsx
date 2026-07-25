"use client";

import { useEffect } from "react";

export function KineticInterface() {
  useEffect(() => {
    const root = document.documentElement;
    const sections = Array.from(document.querySelectorAll<HTMLElement>(".section"));
    const cards = Array.from(
      document.querySelectorAll<HTMLElement>(
        ".project-card, .service-card, .skill-card, .timeline article, .contact-links a",
      ),
    );

    root.classList.add("motion-ui-ready");
    cards.forEach((card, index) => {
      card.style.setProperty("--motion-order", String(index % 6));
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-motion-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 },
    );

    [...sections, ...cards].forEach((element) => observer.observe(element));

    let scrollFrame = 0;
    const updateScroll = () => {
      scrollFrame = 0;
      root.style.setProperty("--kinetic-a", `${window.scrollY * -0.035}px`);
      root.style.setProperty("--kinetic-b", `${window.scrollY * 0.025}px`);
      root.style.setProperty("--kinetic-c", `${window.scrollY * -0.018}px`);
    };
    const onScroll = () => {
      if (!scrollFrame) scrollFrame = window.requestAnimationFrame(updateScroll);
    };
    updateScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
      root.classList.remove("motion-ui-ready");
      root.style.removeProperty("--kinetic-a");
      root.style.removeProperty("--kinetic-b");
      root.style.removeProperty("--kinetic-c");
    };
  }, []);

  return (
    <div className="kinetic-field" aria-hidden="true">
      <i />
      <i />
      <i />
    </div>
  );
}
