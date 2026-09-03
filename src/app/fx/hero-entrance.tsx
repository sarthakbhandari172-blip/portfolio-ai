"use client";

import { useEffect } from "react";
import { useBootPending, useFxEnabled, useMotionOk } from "@/app/fx/fx";

const ENTRANCE_KEY = "sb-hero-entrance-done";

// One-shot entrance sequence: camera push-in + eye ignition + shockwave.
// Runs once per session after the boot preloader completes.
export function HeroEntrance() {
  const fxOn = useFxEnabled();
  const motionOk = useMotionOk();
  const bootPending = useBootPending();

  useEffect(() => {
    if (!fxOn || !motionOk || bootPending) return;
    if (sessionStorage.getItem(ENTRANCE_KEY)) return;

    const lobby = document.querySelector<HTMLElement>(".character-lobby");
    const frame = document.querySelector<HTMLElement>(".character-frame");
    if (!lobby || !frame) return;

    sessionStorage.setItem(ENTRANCE_KEY, "1");

    // Camera push-in: scale from 1.06 → 1.0 with a slight y-drift
    lobby.classList.add("hero-entrance-active");

    // Shockwave ring
    const ring = document.createElement("span");
    ring.className = "hero-entrance-shockwave";
    ring.setAttribute("aria-hidden", "true");
    frame.appendChild(ring);

    // Clean up after animation completes
    const timer = window.setTimeout(() => {
      lobby.classList.remove("hero-entrance-active");
      ring.remove();
    }, 1500);

    return () => {
      window.clearTimeout(timer);
      lobby.classList.remove("hero-entrance-active");
      ring.remove();
    };
  }, [fxOn, motionOk, bootPending]);

  return null;
}
