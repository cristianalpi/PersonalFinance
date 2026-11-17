"use client";

import { useSyncExternalStore } from "react";
import { applyTheme, isDark, type ThemeChoice } from "@/lib/theme";

function subscribe(onChange: () => void) {
  const media = matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", onChange);
  window.addEventListener("themechange", onChange);
  return () => {
    media.removeEventListener("change", onChange);
    window.removeEventListener("themechange", onChange);
  };
}

function useDark() {
  // On the server the theme may follow the system, which only the browser knows: render as light, then correct.
  return useSyncExternalStore(subscribe, isDark, () => false);
}

const SUN = "M12 4V2m0 20v-2m8-8h2M2 12h2m13.66-5.66 1.41-1.41M4.93 19.07l1.41-1.41m0-11.32L4.93 4.93m14.14 14.14-1.41-1.41M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z";
const MOON = "M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z";

/** One tap switches between light and dark. "Automático" lives in Ajustes. */
export function ThemeToggle() {
  const dark = useDark();
  return (
    <button
      type="button"
      onClick={() => applyTheme(dark ? "light" : "dark")}
      className="liquid flex size-10 items-center justify-center rounded-xl"
      aria-label={dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={dark ? "Modo claro" : "Modo oscuro"}
    >
      <svg viewBox="0 0 24 24" className="size-5 transition-transform duration-500" style={{ transform: dark ? "rotate(0deg)" : "rotate(-90deg)" }} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={dark ? SUN : MOON} />
      </svg>
    </button>
  );
}

const OPTIONS: { value: ThemeChoice; label: string; hint: string }[] = [
  { value: "system", label: "Automático", hint: "Igual que tu teléfono o computador" },
  { value: "light", label: "Claro", hint: "Siempre claro" },
  { value: "dark", label: "Oscuro", hint: "Siempre oscuro" },
];

/** The full choice, including following the system, for the settings page. */
export function ThemePicker({ initial }: { initial: ThemeChoice }) {
  const choice = useSyncExternalStore(
    (cb) => {
      window.addEventListener("themechange", cb);
      return () => window.removeEventListener("themechange", cb);
    },
    () => (document.documentElement.dataset.theme as ThemeChoice | undefined) ?? "system",
    () => initial,
  );
  return (
    <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Apariencia">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={choice === o.value}
          onClick={() => applyTheme(o.value)}
          className="rounded-2xl border border-line p-4 text-left transition-colors hover:border-brand aria-checked:border-brand aria-checked:bg-brand/12"
        >
          <span className="block font-semibold">{o.label}</span>
          <span className="block text-sm text-ink-3">{o.hint}</span>
        </button>
      ))}
    </div>
  );
}
