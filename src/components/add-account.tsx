"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AccountKind } from "@/lib/finance";
import { AccountForm } from "./account-form";

const OPEN_EVENT = "add-account";

/** Opens the "Nueva cuenta" modal from anywhere on the page, with a kind already chosen. */
export function openAddAccount(kind: AccountKind = "savings") {
  window.dispatchEvent(new CustomEvent<AccountKind>(OPEN_EVENT, { detail: kind }));
}

/**
 * The "Agregar cuenta" button and its modal: a centred window on wide
 * screens, a sheet rising from the bottom on phones. The form starts fresh
 * each time it opens.
 */
export function AddAccount({ today, autoOpen = false }: { today: string; autoOpen?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [round, setRound] = useState(0);
  const [kind, setKind] = useState<AccountKind>("savings");
  const [saved, setSaved] = useState<string | null>(null);

  const open = useCallback((start: AccountKind = "savings") => {
    setKind(start);
    setRound((r) => r + 1);
    setSaved(null);
    dialog.current?.showModal();
  }, []);

  useEffect(() => {
    const onOpen = (e: Event) => open((e as CustomEvent<AccountKind>).detail);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, [open]);
  const close = useCallback(() => dialog.current?.close(), []);
  const onSaved = useCallback(() => {
    close();
    setSaved("Cuenta agregada.");
  }, [close]);

  useEffect(() => {
    if (autoOpen) dialog.current?.showModal();
  }, [autoOpen]);

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(null), 3500);
    return () => clearTimeout(t);
  }, [saved]);

  return (
    <>
      <button type="button" onClick={() => open()} className="btn h-12 gap-2 rounded-2xl px-5 text-base">
        <span aria-hidden="true" className="text-xl leading-none">
          +
        </span>
        Agregar cuenta
      </button>

      <dialog
        ref={dialog}
        aria-labelledby="add-account-title"
        className="sheet"
        onClick={(e) => {
          // A click on the dimmed backdrop (the dialog element itself) closes it.
          if (e.target === e.currentTarget) close();
        }}
      >
        <div className="flex flex-col gap-4 p-5 sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <h2 id="add-account-title" className="display text-2xl">
              Nueva cuenta
            </h2>
            <button type="button" onClick={close} className="btn-quiet size-10 p-0 text-lg" aria-label="Cerrar">
              ✕
            </button>
          </div>
          <AccountForm key={round} today={today} onSaved={onSaved} initialKind={kind} />
        </div>
      </dialog>

      {saved && (
        <p role="status" className="card rise fixed bottom-28 left-1/2 z-30 -translate-x-1/2 px-5 py-3 text-sm font-semibold sm:bottom-8 sm:p-4">
          ✓ {saved}
        </p>
      )}
    </>
  );
}
