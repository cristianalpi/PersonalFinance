import Link from "next/link";
import { signOut } from "../actions";

const NAV = [
  { href: "/", label: "Resumen" },
  { href: "/cuentas", label: "Cuentas" },
  { href: "/movimientos", label: "Movimientos" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-16 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-3 py-5">
        <nav className="flex items-center gap-1 text-sm">
          <span className="eyebrow mr-3">Finanzas</span>
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-lg px-3 py-1.5 text-ink-2 hover:bg-surface hover:text-ink">
              {item.label}
            </Link>
          ))}
        </nav>
        <form action={signOut}>
          <button className="btn-quiet">Salir</button>
        </form>
      </header>
      <main className="flex flex-col gap-6">{children}</main>
    </div>
  );
}
