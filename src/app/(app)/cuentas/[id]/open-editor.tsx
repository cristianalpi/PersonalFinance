"use client";

import { useEffect } from "react";

/** Opens the balance form for links ending in #saldo. (#editar is handled by the card itself.) */
export function OpenEditorFromHash() {
  useEffect(() => {
    const hash = window.location.hash;
    if (hash === "#saldo") {
      document.querySelector<HTMLButtonElement>("#saldo button")?.click();
    }
  }, []);
  return null;
}
