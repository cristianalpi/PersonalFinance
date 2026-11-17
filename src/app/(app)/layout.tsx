import Link from "next/link";
import { Logo } from "@/components/logo";
import { AdvisorButton, Nav } from "@/components/nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { count } = await supabase.from("wallet_inbox").select("id", { count: "exact", head: true });

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-40 sm:px-6 lg:pb-16">
      {/* view-transition-name makes the header a stacking context; z-40 keeps the fixed tab bar inside it above the page. */}
      <header className="relative z-40 flex items-center justify-between gap-3 py-4 sm:py-5" style={{ viewTransitionName: "site-header" }}>
        <div className="flex items-center gap-4">
          <Logo />
          <Nav pending={count ?? 0} />
        </div>
        <div className="flex items-center gap-2">
          <AdvisorButton />
          <ThemeToggle />
          {/* Ajustes is an icon here on every screen size. */}
          <Link href="/ajustes" className="liquid flex size-10 items-center justify-center rounded-xl" aria-label="Ajustes" title="Ajustes">
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden="true">
              <path d="M4 7h10m4 0h2M4 17h2m4 0h10M16 5v4M8 15v4" />
            </svg>
          </Link>
        </div>
      </header>
      <main className="flex flex-col gap-6 sm:gap-8">{children}</main>
    </div>
  );
}
