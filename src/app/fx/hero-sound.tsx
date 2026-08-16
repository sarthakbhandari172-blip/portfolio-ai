"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useFxEnabled } from "@/app/fx/fx";
import { SND_STORAGE_KEY } from "@/app/fx/sound-toggle";

// Read the shared SND store (same pattern as sound-toggle)
let sndOn = false;
let sndLoaded = false;

function readSnd(): boolean {
  if (!sndLoaded) {
    sndLoaded = true;
    try { sndOn = window.localStorage.getItem(SND_STORAGE_KEY) === "on"; } catch { sndOn = false; }
  }
  return sndOn;
}

const listeners = new Set<() => void>();
function subscribe(cb: () => void) {
  listeners.add(cb);
  // Also listen for storage changes from the toggle button
  const onStorage = (e: StorageEvent) => { if (e.key === SND_STORAGE_KEY) { sndLoaded = false; listeners.forEach(f => f()); } };
  window.addEventListener("storage", onStorage);
  return () => { listeners.delete(cb); window.removeEventListener("storage", onStorage); };
}

// Hero ambient sound: low energy hum + crackle on surges.
// Fully synthesized via Web Audio API, no files.
export function HeroSound() {
  const fxOn = useFxEnabled();
  const enabled = useSyncExternalStore(subscribe, readSnd, () => false);

  useEffect(() => {
    if (!fxOn || !enabled) return;
    if (typeof AudioContext === "undefined") return;

    const ctx = new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();

    // Low ambient hum — two detuned oscillators for thickness
    const humGain = ctx.createGain();
    humGain.gain.value = 0.012;
    humGain.connect(ctx.destination);

    const hum1 = ctx.createOscillator();
    hum1.type = "sine";
    hum1.frequency.value = 55;
    hum1.connect(humGain);
    hum1.start();

    const hum2 = ctx.createOscillator();
    hum2.type = "sine";
    hum2.frequency.value = 57.5; // slight detune for warmth
    hum2.connect(humGain);
    hum2.start();

    // LFO to modulate hum volume for breathing feel
    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.15; // very slow
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.004;
    lfo.connect(lfoGain);
    lfoGain.connect(humGain.gain);
    lfo.start();

    // Crackle: periodic bursts of filtered noise
    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) {
      noiseData[i] = Math.random() * 2 - 1;
    }

    let crackleTimer = 0;
    const scheduleCrackle = () => {
      if (ctx.state === "closed") return;
      const now = ctx.currentTime;

      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.value = 3000 + Math.random() * 4000;

      const crackleGain = ctx.createGain();
      crackleGain.gain.setValueAtTime(0, now);
      crackleGain.gain.linearRampToValueAtTime(0.008 + Math.random() * 0.006, now + 0.01);
      crackleGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06 + Math.random() * 0.08);

      noise.connect(filter).connect(crackleGain).connect(ctx.destination);
      noise.start(now);
      noise.stop(now + 0.15);

      crackleTimer = window.setTimeout(scheduleCrackle, 2000 + Math.random() * 6000);
    };
    crackleTimer = window.setTimeout(scheduleCrackle, 1000);

    // Pause when not visible
    const onVisibility = () => {
      if (document.hidden) {
        void ctx.suspend();
      } else {
        void ctx.resume();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    // Pause when hero scrolled away
    const lobby = document.querySelector(".character-lobby");
    let heroVisible = true;
    const io = lobby
      ? new IntersectionObserver(([entry]) => {
          heroVisible = entry.isIntersecting;
          if (heroVisible) void ctx.resume();
          else void ctx.suspend();
        })
      : null;
    if (lobby && io) io.observe(lobby);

    return () => {
      window.clearTimeout(crackleTimer);
      document.removeEventListener("visibilitychange", onVisibility);
      io?.disconnect();
      hum1.stop();
      hum2.stop();
      lfo.stop();
      void ctx.close();
    };
  }, [fxOn, enabled]);

  return null;
}
