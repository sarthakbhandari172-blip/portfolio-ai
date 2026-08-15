"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useFxEnabled } from "@/app/fx/fx";

export const SND_STORAGE_KEY = "sb-snd";

// UI blips are OFF by default. AudioContext is only created after the user
// explicitly enables sound (a user gesture, so autoplay policy is satisfied).

let sndOn = false;
let sndLoaded = false;
const listeners = new Set<() => void>();

function readSnd(): boolean {
  if (!sndLoaded) {
    sndLoaded = true;
    try {
      sndOn = window.localStorage.getItem(SND_STORAGE_KEY) === "on";
    } catch {
      sndOn = false;
    }
  }
  return sndOn;
}

function setSnd(on: boolean) {
  sndOn = on;
  try {
    window.localStorage.setItem(SND_STORAGE_KEY, on ? "on" : "off");
  } catch {
    // ignore
  }
  listeners.forEach((notify) => notify());
}

function subscribe(notify: () => void) {
  listeners.add(notify);
  return () => {
    listeners.delete(notify);
  };
}

let audio: AudioContext | null = null;

function blip(frequency: number, gainValue: number) {
  if (!audio) audio = new AudioContext();
  if (audio.state === "suspended") void audio.resume();
  const now = audio.currentTime;
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = "square";
  oscillator.frequency.setValueAtTime(frequency, now);
  gain.gain.setValueAtTime(gainValue, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);
  oscillator.connect(gain).connect(audio.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.06);
}

const INTERACTIVE = 'a, button, [role="button"]';

export function SoundToggle() {
  const fxOn = useFxEnabled();
  const enabled = useSyncExternalStore(subscribe, readSnd, () => false);

  useEffect(() => {
    if (!enabled || !fxOn) return;

    let lastHover: Element | null = null;
    const onPointerOver = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const interactive = target?.closest(INTERACTIVE) ?? null;
      if (interactive && interactive !== lastHover) blip(1750, 0.012);
      lastHover = interactive;
    };
    const onClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest(INTERACTIVE)) blip(920, 0.02);
    };

    document.addEventListener("pointerover", onPointerOver, { passive: true });
    document.addEventListener("click", onClick, { passive: true });
    return () => {
      document.removeEventListener("pointerover", onPointerOver);
      document.removeEventListener("click", onClick);
    };
  }, [enabled, fxOn]);

  return (
    <button
      type="button"
      className="fx-toggle snd-toggle"
      onClick={() => setSnd(!enabled)}
      aria-pressed={enabled}
      aria-label={`Interface sounds ${enabled ? "on" : "off"}. Toggle interface sounds.`}
      title="Toggle interface sounds"
    >
      <span className="fx-toggle__label">SND</span>
      <span className="fx-toggle__state" data-snd={enabled ? "on" : "off"}>
        {enabled ? "ON" : "OFF"}
      </span>
    </button>
  );
}
