"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "Resumen", icon: "M4 13h6V4H4zm10 7h6V4h-6zM4 20h6v-4H4z" },
  { href: "/cuentas", label: "Cuentas", icon: "M3 7h18v12H3zm0 4h18M7 15h4" },
  { href: "/movimientos", label: "Movimientos", icon: "M7 4v16m0 0-3-3m3 3 3-3M17 20V4m0 0-3 3m3-3 3 3" },
  { href: "/pagos", label: "Pagos", icon: "M4 5h16v15H4zM4 9h16M8 3v4m8-4v4m-7 7 2 2 4-4" },
  { href: "/ajustes", label: "Ajustes", icon: "M4 7h10m4 0h2M4 17h2m4 0h10M16 5v4M8 15v4" },
];

/** Top links on wide screens; a thumb-reachable tab bar pinned to the bottom on phones. */
export function Nav({ pending }: { pending: number }) {
  const pathname = usePathname();
  const items = ITEMS.map((item) => ({ ...item, active: item.href === "/" ? pathname === "/" : pathname.startsWith(item.href) }));
  const dot = (href: string) =>
    href === "/movimientos" && pending > 0 ? (
      <span className="absolute -right-1 -top-1 size-2.5 rounded-full bg-debt ring-2 ring-surface" aria-label={`${pending} por revisar`} />
    ) : null;

  return (
    <>
      <nav className="hidden items-center gap-1 text-sm sm:flex" aria-label="Secciones">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={item.active ? "page" : undefined}
            className={`relative rounded-full px-3.5 py-1.5 transition-colors ${item.active ? "bg-brand/15 font-semibold text-ink" : "text-ink-2 hover:text-ink"}`}
          >
            {item.label}
            {dot(item.href)}
          </Link>
        ))}
      </nav>
      <nav
        className="card fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-20 grid grid-cols-5 rounded-3xl p-1.5 sm:hidden"
        aria-label="Secciones"
      >
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={item.active ? "page" : undefined}
            className={`flex flex-col items-center gap-0.5 rounded-2xl py-1.5 text-[11px] font-medium transition-colors ${item.active ? "bg-brand/15 text-brand" : "text-ink-3"}`}
          >
            <span className="relative">
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={item.active ? 2 : 1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d={item.icon} />
              </svg>
              {dot(item.href)}
            </span>
            {item.label}
          </Link>
        ))}
      </nav>
      {/* Phones: registering a purchase is the most frequent action, so it stays one tap away. */}
      {!pathname.startsWith("/movimientos") && (
        <Link
          href="/movimientos#nuevo"
          className="btn fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 z-20 h-12 gap-2 rounded-full px-5 sm:hidden"
        >
          <span aria-hidden="true" className="text-lg leading-none">+</span> Registrar gasto
        </Link>
      )}
    </>
  );
}
