import Link from "next/link";
import { Logo } from "@/components/logo";
import { Nav } from "@/components/nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { count } = await supabase.from("wallet_inbox").select("id", { count: "exact", head: true });

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-36 sm:px-6 sm:pb-16">
      <header className="flex items-center justify-between gap-3 py-4 sm:py-5">
        <div className="flex items-center gap-4">
          <Logo />
          <Nav pending={count ?? 0} />
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {/* On phones Ajustes is not in the tab bar, so it lives here. */}
          <Link href="/ajustes" className="btn-quiet size-10 p-0 sm:hidden" aria-label="Ajustes">
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden="true">
              <path d="M4 7h10m4 0h2M4 17h2m4 0h10M16 5v4M8 15v4" />
            </svg>
          </Link>
          <form action={signOut}>
            <button className="btn-quiet">Salir</button>
          </form>
        </div>
      </header>
      <main className="flex flex-col gap-6 sm:gap-8">{children}</main>
    </div>
  );
}
