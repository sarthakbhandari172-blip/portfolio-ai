// Shared FX contract.
// <html data-fx="on|off"> is the single switch every effect must respect.
// Persisted in localStorage under "sb-fx"; other agents read the same attribute.

import { useSyncExternalStore } from "react";

export const FX_STORAGE_KEY = "sb-fx";

export function fxEnabled(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.dataset.fx !== "off";
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function isMobileViewport(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 768px)").matches;
}

/** True when heavy motion may run right now. */
export function motionAllowed(): boolean {
  return fxEnabled() && !prefersReducedMotion();
}

export function setFx(on: boolean) {
  document.documentElement.dataset.fx = on ? "on" : "off";
  try {
    window.localStorage.setItem(FX_STORAGE_KEY, on ? "on" : "off");
  } catch {
    // storage unavailable (private mode) — attribute still works for the session
  }
}

/** Observe data-fx flips on <html>. Returns an unsubscribe fn. */
export function onFxChange(callback: (enabled: boolean) => void): () => void {
  const observer = new MutationObserver(() => callback(fxEnabled()));
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-fx"],
  });
  return () => observer.disconnect();
}

/** Reactive FX flag (SSR renders as "on"). */
export function useFxEnabled(): boolean {
  return useSyncExternalStore(
    (notify) => onFxChange(notify),
    fxEnabled,
    () => true,
  );
}

/** Reactive reduced-motion check (SSR renders as "motion not allowed"). */
export function useMotionOk(): boolean {
  return useSyncExternalStore(
    (notify) => {
      const query = window.matchMedia("(prefers-reduced-motion: reduce)");
      query.addEventListener("change", notify);
      return () => query.removeEventListener("change", notify);
    },
    () => !prefersReducedMotion(),
    () => false,
  );
}

/** Reactive "boot preloader overlay currently showing" flag. */
export function useBootPending(): boolean {
  return useSyncExternalStore(
    (notify) => {
      const observer = new MutationObserver(notify);
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-boot"],
      });
      return () => observer.disconnect();
    },
    () => document.documentElement.dataset.boot === "show",
    () => false,
  );
}
