"use client";

import { useEffect, useRef, useState } from "react";
import { useBootPending } from "@/app/fx/fx";

// Server-rendered overlay, hidden until the inline layout script sets
// html[data-boot="show"] (first visit this session, FX on, motion OK).
// This guarantees no hero flash and zero layout shift.

export const BOOT_SESSION_KEY = "sb-boot-done";

const BOOT_LINES = [
  "> INITIALIZING SYSTEM ...",
  "> ESTABLISHING UPLINK ...",
  "> LOADING INTERFACE MODULES ...",
  "> ACCESS GRANTED",
];

const TYPE_MS = 1850;
const WIPE_MS = 420;
const SEGMENTS = 24;
const CHARS_TOTAL = BOOT_LINES.reduce((sum, line) => sum + line.length, 0);

export function BootPreloader() {
  const active = useBootPending();
  const [elapsed, setElapsed] = useState(0);
  const [wiping, setWiping] = useState(false);
  const doneRef = useRef(false);

  useEffect(() => {
    if (!active) return;

    let frame = 0;
    let wipeTimer = 0;
    const start = performance.now();

    const finish = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      window.cancelAnimationFrame(frame);
      setWiping(true);
      try {
        window.sessionStorage.setItem(BOOT_SESSION_KEY, "1");
      } catch {
        // ignore
      }
      wipeTimer = window.setTimeout(() => {
        delete document.documentElement.dataset.boot;
      }, WIPE_MS);
    };

    const tick = (now: number) => {
      const t = now - start;
      setElapsed(t);
      if (t >= TYPE_MS) {
        finish();
        return;
      }
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);

    const skip = () => finish();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === "Escape" || event.key === " ") skip();
    };
    window.addEventListener("pointerdown", skip);
    window.addEventListener("keydown", onKey);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(wipeTimer);
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("keydown", onKey);
    };
  }, [active]);

  // Server + first paint render the shell so the overlay can appear pre-hydration.
  const progress = Math.min(1, elapsed / TYPE_MS);
  const charsShown = Math.floor(progress * CHARS_TOTAL);
  const filled = Math.round(progress * SEGMENTS);

  const lines: string[] = [];
  for (let index = 0, budget = charsShown; index < BOOT_LINES.length; index += 1) {
    const line = BOOT_LINES[index];
    lines.push(active ? line.slice(0, Math.max(0, Math.min(line.length, budget))) : "");
    budget -= line.length;
  }

  return (
    <div
      className={`boot-preloader${wiping ? " boot-preloader--wipe" : ""}`}
      aria-hidden={!active}
      role="status"
      aria-label="System boot sequence. Click to skip."
    >
      <div className="boot-preloader__frame">
        <div className="boot-preloader__terminal">
          {lines.map((text, index) => (
            <p key={BOOT_LINES[index]} data-granted={index === BOOT_LINES.length - 1 || undefined}>
              {text}
              {active && !wiping && text.length > 0 && text.length < BOOT_LINES[index].length ? (
                <span className="boot-preloader__caret" aria-hidden="true" />
              ) : null}
            </p>
          ))}
        </div>
        <div className="boot-preloader__bar" aria-hidden="true">
          {Array.from({ length: SEGMENTS }, (_, index) => (
            <span key={index} data-on={index < filled || undefined} />
          ))}
        </div>
        <p className="boot-preloader__hint" aria-hidden="true">
          [ CLICK TO SKIP ]
        </p>
      </div>
      <span className="boot-preloader__scan" aria-hidden="true" />
    </div>
  );
}
