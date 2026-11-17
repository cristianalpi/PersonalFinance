"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface Item {
  href: string;
  label: string;
  short?: string;
  icon: string;
}

const I = {
  home: "M4 13h6V4H4zm10 7h6V4h-6zM4 20h6v-4H4z",
  debts: "M3 6l6 6 4-4 8 8M21 11v5h-5",
  moves: "M7 4v16m0 0-3-3m3 3 3-3M17 20V4m0 0-3 3m3-3 3 3",
  bills: "M4 5h16v15H4zM4 9h16M8 3v4m8-4v4m-7 7 2 2 4-4",
  goals: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-4a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0-4a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z",
  accounts: "M3 7h18v12H3zm0 4h18M7 15h4",
  advisor: "M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15.5l-1.9-4.6L5.5 9l4.6-1.4zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z",
  more: "M5 12h.01M12 12h.01M19 12h.01",
};

/** Desktop shows everything; the phone bar keeps the four most used and folds the rest into "Más". */
const ALL: Item[] = [
  { href: "/", label: "Resumen", short: "Inicio", icon: I.home },
  { href: "/movimientos", label: "Movimientos", icon: I.moves },
  { href: "/deudas", label: "Deudas", icon: I.debts },
  { href: "/metas", label: "Metas", icon: I.goals },
  { href: "/pagos", label: "Pagos", icon: I.bills },
  { href: "/cuentas", label: "Cuentas", icon: I.accounts },
  { href: "/asesor", label: "Asesor", icon: I.advisor },
];
const PHONE_BAR = ALL.slice(0, 4);
const PHONE_MORE: Item[] = [...ALL.slice(4), { href: "/ajustes", label: "Ajustes", icon: "M4 7h10m4 0h2M4 17h2m4 0h10M16 5v4M8 15v4" }];

function Icon({ d, active }: { d: string; active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="size-[22px]" fill="none" stroke="currentColor" strokeWidth={active ? 2.1 : 1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

export function Nav({ pending }: { pending: number }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const inMore = PHONE_MORE.some((i) => isActive(i.href));

  // Close the "Más" menu when tapping outside or pressing Escape; links close it themselves.
  useEffect(() => {
    if (!moreOpen) return;
    const onDown = (e: PointerEvent) => {
      if (!moreRef.current?.contains(e.target as Node)) setMoreOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMoreOpen(false);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [moreOpen]);

  const dot = (href: string) =>
    href === "/movimientos" && pending > 0 ? (
      <span className="absolute -right-1 -top-1 size-2.5 rounded-full bg-debt ring-2 ring-surface" aria-label={`${pending} por revisar`} />
    ) : null;

  return (
    <>
      <nav className="hidden items-center gap-0.5 text-sm lg:flex" aria-label="Secciones">
        {ALL.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive(item.href) ? "page" : undefined}
            className={`relative rounded-full px-3 py-1.5 transition-colors ${isActive(item.href) ? "bg-brand/15 font-semibold text-ink" : "text-ink-2 hover:text-ink"}`}
          >
            {item.label}
            {dot(item.href)}
          </Link>
        ))}
      </nav>

      {/* Phones and tablets: a floating liquid-glass bar within thumb reach. */}
      <div ref={moreRef} className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-30 lg:hidden">
        {moreOpen && (
          <div className="liquid rise absolute bottom-full right-0 mb-3 w-56 rounded-3xl p-2" role="menu" aria-label="Más secciones">
            {PHONE_MORE.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                onClick={() => setMoreOpen(false)}
                className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors ${isActive(item.href) ? "liquid-bubble text-brand" : "text-ink hover:bg-white/10"}`}
              >
                <Icon d={item.icon} active={isActive(item.href)} />
                {item.label}
              </Link>
            ))}
          </div>
        )}
        <nav className="liquid grid grid-cols-5 rounded-[1.75rem] p-1.5" aria-label="Secciones">
          {PHONE_BAR.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                onClick={() => setMoreOpen(false)}
                className={`flex flex-col items-center gap-0.5 rounded-[1.4rem] py-1.5 text-[11px] font-semibold transition-all duration-300 ${active ? "liquid-bubble scale-[1.04] text-brand" : "text-ink-2"}`}
              >
                <span className="relative">
                  <Icon d={item.icon} active={active} />
                  {dot(item.href)}
                </span>
                {item.short ?? item.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen((o) => !o)}
            aria-expanded={moreOpen}
            aria-haspopup="menu"
            className={`flex flex-col items-center gap-0.5 rounded-[1.4rem] py-1.5 text-[11px] font-semibold transition-all duration-300 ${moreOpen || inMore ? "liquid-bubble text-brand" : "text-ink-2"}`}
          >
            <Icon d={I.more} active={moreOpen || inMore} />
            Más
          </button>
        </nav>
      </div>

      {/* Registering a purchase is the most frequent action, so it stays one tap away on phones. */}
      {!pathname.startsWith("/movimientos") && !moreOpen && (
        <Link
          href="/movimientos#nuevo"
          className="liquid liquid-tint fixed bottom-[calc(5.75rem+env(safe-area-inset-bottom))] right-4 z-20 flex h-12 items-center gap-2 rounded-full px-5 text-sm font-semibold lg:hidden"
        >
          <span aria-hidden="true" className="text-lg leading-none">
            +
          </span>
          Registrar gasto
        </Link>
      )}
    </>
  );
}
