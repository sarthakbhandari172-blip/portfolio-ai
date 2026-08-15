"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { isMobileViewport, prefersReducedMotion, useFxEnabled } from "@/app/fx/fx";

gsap.registerPlugin(ScrollTrigger);

// Core scroll engine: Lenis smooth scroll + hero parallax + one-shot
// heading glitch on section entry. Everything gates on html[data-fx].
export function MotionCore() {
  const fxOn = useFxEnabled();

  useEffect(() => {
    if (!fxOn || prefersReducedMotion()) return;

    const mobile = isMobileViewport();
    let lenis: Lenis | null = null;
    let rafSync: ((time: number) => void) | null = null;

    if (!mobile) {
      lenis = new Lenis({
        duration: 1.05,
        anchors: true,
      });
      lenis.on("scroll", ScrollTrigger.update);
      rafSync = (time: number) => lenis?.raf(time * 1000);
      gsap.ticker.add(rafSync);
      gsap.ticker.lagSmoothing(0);
    }

    const triggers: ScrollTrigger[] = [];
    const tweens: gsap.core.Tween[] = [];

    // Hero portrait + world parallax (transform-only, scrubbed).
    const lobby = document.querySelector<HTMLElement>(".character-lobby");
    if (lobby && !mobile) {
      tweens.push(
        gsap.to(lobby, {
          "--deck-parallax": "-92px",
          "--world-parallax": "70px",
          ease: "none",
          scrollTrigger: {
            trigger: lobby,
            start: "top top",
            end: "bottom top",
            scrub: 0.6,
          },
        }),
      );
    }

    // Headings glitch once each time they enter the viewport.
    const headings = document.querySelectorAll<HTMLElement>(
      ".hybrid-ui .section-heading h2, .hybrid-ui .display-heading",
    );
    headings.forEach((heading) => {
      const glitch = () => {
        heading.classList.remove("glitch-in");
        // restart the animation reliably
        void heading.offsetWidth;
        heading.classList.add("glitch-in");
      };
      triggers.push(
        ScrollTrigger.create({
          trigger: heading,
          start: "top 88%",
          onEnter: glitch,
          onEnterBack: glitch,
        }),
      );
    });

    return () => {
      triggers.forEach((trigger) => trigger.kill());
      tweens.forEach((tween) => {
        tween.scrollTrigger?.kill();
        tween.kill();
      });
      headings.forEach((heading) => heading.classList.remove("glitch-in"));
      if (lobby) {
        lobby.style.removeProperty("--deck-parallax");
        lobby.style.removeProperty("--world-parallax");
      }
      if (rafSync) gsap.ticker.remove(rafSync);
      lenis?.destroy();
    };
  }, [fxOn]);

  return null;
}
