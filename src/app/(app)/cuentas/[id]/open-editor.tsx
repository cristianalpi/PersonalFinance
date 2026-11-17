"use client";

import { useEffect } from "react";

/** Opens the editor when the page is reached through a link ending in #editar. */
export function OpenEditorFromHash() {
  useEffect(() => {
    if (window.location.hash !== "#editar") return;
    const el = document.getElementById("editar");
    if (el instanceof HTMLDetailsElement) {
      el.open = true;
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);
  return null;
}
