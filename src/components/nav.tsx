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
      <span className="absolute -right-1 -top-1 size-2 rounded-full bg-debt" aria-label={`${pending} por revisar`} />
    ) : null;

  return (
    <>
      <nav className="hidden items-center gap-1 text-sm sm:flex" aria-label="Secciones">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={item.active ? "page" : undefined}
            className={`relative rounded-lg px-3 py-1.5 transition-colors ${item.active ? "bg-surface text-ink shadow-sm" : "text-ink-2 hover:text-ink"}`}
          >
            {item.label}
            {dot(item.href)}
          </Link>
        ))}
      </nav>
      <nav
        className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
        aria-label="Secciones"
      >
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={item.active ? "page" : undefined}
            className={`flex flex-col items-center gap-0.5 py-2 text-[11px] ${item.active ? "text-ink" : "text-ink-3"}`}
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
          className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-4 z-20 flex h-12 items-center gap-2 rounded-full bg-ink px-5 text-sm font-medium text-bg shadow-lg shadow-ink/20 sm:hidden"
        >
          <span aria-hidden="true" className="text-lg leading-none">+</span> Registrar gasto
        </Link>
      )}
    </>
  );
}
