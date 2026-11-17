"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

interface InstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const noop = () => () => {};
const standalone = () => window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
const isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

/**
 * Installing puts Guaca on the home screen, opening full screen like an app.
 * On iPhone it is also what web notifications need. Chrome and Android offer
 * a one-tap button; Safari needs the Share menu, so the steps are shown.
 */
export function InstallCard() {
  const installed = useSyncExternalStore(noop, standalone, () => false);
  const ios = useSyncExternalStore(noop, isIOS, () => false);
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallPrompt);
    };
    const onInstalled = () => setDone(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  return (
    <section className="card flex flex-col gap-3">
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/icon-192.png" alt="" className="size-12 rounded-2xl shadow-md" />
        <div>
          <h2 className="display text-2xl">Instalar como app</h2>
          <p className="text-sm text-ink-3">Guaca en tu pantalla de inicio, a pantalla completa y sin la barra del navegador.</p>
        </div>
      </div>
      {installed || done ? (
        <p className="pill pill-idea self-start text-sm">✓ Ya la estás usando como app</p>
      ) : prompt ? (
        <button
          type="button"
          className="btn self-start"
          onClick={async () => {
            await prompt.prompt();
            const { outcome } = await prompt.userChoice;
            if (outcome === "accepted") setDone(true);
            setPrompt(null);
          }}
        >
          Instalar Guaca
        </button>
      ) : (
        <ol className="list-decimal space-y-1 pl-5 text-sm text-ink-2">
          {ios ? (
            <>
              <li>Abre esta página en Safari.</li>
              <li>
                Toca <span className="font-semibold text-ink">Compartir</span> (el cuadro con la flecha hacia arriba).
              </li>
              <li>
                Elige <span className="font-semibold text-ink">Agregar a inicio</span> y luego <span className="font-semibold text-ink">Agregar</span>.
              </li>
            </>
          ) : (
            <>
              <li>En el celular, abre esta página en Chrome o Safari.</li>
              <li>
                En el menú del navegador elige <span className="font-semibold text-ink">Instalar app</span> o <span className="font-semibold text-ink">Agregar a inicio</span>.
              </li>
            </>
          )}
        </ol>
      )}
      <p className="text-xs text-ink-3">En iPhone, instalarla es el paso que necesitan las notificaciones de recordatorio que vienen después.</p>
    </section>
  );
}
