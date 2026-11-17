"use client";

import { useEffect } from "react";

/** Opens the editor for links ending in #editar, and scrolls to the balance form for #saldo. */
export function OpenEditorFromHash() {
  useEffect(() => {
    const hash = window.location.hash;
    if (hash === "#editar") {
      const el = document.getElementById("editar");
      if (el instanceof HTMLDetailsElement) {
        el.open = true;
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
    if (hash === "#saldo") {
      document.querySelector<HTMLButtonElement>("#saldo button")?.click();
    }
  }, []);
  return null;
}
