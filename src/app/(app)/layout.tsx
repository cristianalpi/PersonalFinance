import { Nav } from "@/components/nav";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { count } = await supabase.from("wallet_inbox").select("id", { count: "exact", head: true });

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-28 sm:px-6 sm:pb-16">
      <header className="flex items-center justify-between gap-3 py-4 sm:py-5">
        <div className="flex items-center gap-4">
          <span className="display text-xl">Finanzas</span>
          <Nav pending={count ?? 0} />
        </div>
        <form action={signOut}>
          <button className="btn-quiet">Salir</button>
        </form>
      </header>
      <main className="flex flex-col gap-6 sm:gap-8">{children}</main>
    </div>
  );
}
