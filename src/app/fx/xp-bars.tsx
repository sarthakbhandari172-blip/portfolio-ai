"use client";

import { useEffect } from "react";
import { prefersReducedMotion, useFxEnabled } from "@/app/fx/fx";

// Skill meters become XP bars: fill animates in and an injected counter
// counts up to the proficiency value when scrolled into view.
export function XpBars() {
  const fxOn = useFxEnabled();

  useEffect(() => {
    if (!fxOn) return;
    const reduced = prefersReducedMotion();

    const meters = Array.from(
      document.querySelectorAll<HTMLElement>(".hybrid-ui .skill-card .skill-meter"),
    );
    const readouts = new Map<HTMLElement, { element: HTMLElement; value: number }>();
    const counters = new Map<HTMLElement, number>();

    meters.forEach((meter) => {
      const fill = meter.querySelector<HTMLElement>("span");
      const value = fill ? Math.round(parseFloat(fill.style.width)) || 0 : 0;
      const readout = document.createElement("span");
      readout.className = "xp-readout";
      readout.setAttribute("aria-hidden", "true");
      readout.textContent = reduced ? `${value}% XP` : "0% XP";
      meter.before(readout);
      readouts.set(meter, { element: readout, value });
    });

    if (reduced) {
      return () => readouts.forEach(({ element }) => element.remove());
    }

    const countUp = (meter: HTMLElement) => {
      const entry = readouts.get(meter);
      if (!entry) return;
      const duration = 850;
      let start = 0;
      const step = (now: number) => {
        if (!start) start = now;
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        entry.element.textContent = `${Math.round(eased * entry.value)}% XP`;
        if (t < 1) counters.set(meter, window.requestAnimationFrame(step));
      };
      counters.set(meter, window.requestAnimationFrame(step));
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const meter = entry.target as HTMLElement;
          if (entry.isIntersecting) {
            if (!meter.classList.contains("xp-armed")) {
              meter.classList.add("xp-armed");
              countUp(meter);
            }
          } else {
            meter.classList.remove("xp-armed");
            const pending = counters.get(meter);
            if (pending) window.cancelAnimationFrame(pending);
            const data = readouts.get(meter);
            if (data) data.element.textContent = "0% XP";
          }
        });
      },
      { threshold: 0.6 },
    );
    meters.forEach((meter) => observer.observe(meter));

    return () => {
      observer.disconnect();
      counters.forEach((frame) => window.cancelAnimationFrame(frame));
      readouts.forEach(({ element }) => element.remove());
      meters.forEach((meter) => meter.classList.remove("xp-armed"));
    };
  }, [fxOn]);

  return null;
}
