"use client";

import { setFx, useFxEnabled } from "@/app/fx/fx";

export function FxToggle() {
  const enabled = useFxEnabled();

  return (
    <button
      type="button"
      className="fx-toggle"
      onClick={() => setFx(!enabled)}
      aria-pressed={enabled}
      aria-label={`Visual effects ${enabled ? "on" : "off"}. Toggle visual effects.`}
      title="Toggle visual effects"
    >
      <span className="fx-toggle__label">FX</span>
      <span className="fx-toggle__state">{enabled ? "ON" : "OFF"}</span>
      <span className="fx-toggle__led" aria-hidden="true" />
    </button>
  );
}
