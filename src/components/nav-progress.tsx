"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * A thin bar across the top while a screen is on its way, so a tap always
 * shows it was heard. It starts on any click on an internal link and stops
 * when the address changes (or after a while, if the navigation never lands).
 */
export function NavProgress() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const here = `${pathname}?${search}`;
  const [active, setActive] = useState(false);
  const [seen, setSeen] = useState(here);
  if (seen !== here) {
    setSeen(here);
    setActive(false);
  }

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname.startsWith("/api/")) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      setActive(true);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => setActive(false), 12000);
    return () => clearTimeout(t);
  }, [active]);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px] overflow-hidden transition-opacity duration-300 ${active ? "opacity-100" : "opacity-0"}`}
      style={{ top: "env(safe-area-inset-top)" }}
    >
      {active && <div className="nav-progress h-full w-1/3 rounded-full" />}
    </div>
  );
}
