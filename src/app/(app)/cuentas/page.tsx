import Link from "next/link";
import { deleteAccount } from "@/app/actions";
import { AccountCard } from "@/components/account-card";
import { AddAccount } from "@/components/add-account";
import { UsageBar } from "@/components/usage-bar";
import { loadData } from "@/lib/data";
import { balanceAt, formatCOP, holdsMoney, type AccountKind } from "@/lib/finance";

const GROUPS: { kind: AccountKind; title: string }[] = [
  { kind: "savings", title: "Cuentas de ahorros" },
  { kind: "cash", title: "Efectivo" },
  { kind: "credit_card", title: "Tarjetas de crédito" },
  { kind: "loan", title: "Créditos" },
];

export default async function AccountsPage({ searchParams }: { searchParams: Promise<{ nueva?: string }> }) {
  const { accounts, txs, today } = await loadData();
  const autoOpen = (await searchParams).nueva === "1";
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <h1 className="display text-3xl">Cuentas</h1>
        <AddAccount today={today} autoOpen={autoOpen} />
      </div>

      {accounts.length === 0 && (
        <section className="card max-w-xl">
          <p className="display text-xl">Aún no tienes cuentas</p>
          <p className="mt-1 text-ink-2">Agrega tus cuentas de ahorros, tu efectivo, tus tarjetas y tus créditos con el saldo de hoy.</p>
        </section>
      )}

      {GROUPS.map(({ kind, title }) => {
        const group = accounts.filter((a) => a.kind === kind);
        if (group.length === 0) return null;
        return (
          <section key={kind} aria-label={title}>
            <h2 className="display text-2xl">{title}</h2>
            <ul className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.map((account, i) => {
                const balance = balanceAt(account, txs);
                return (
                  <li key={account.id} className="rise flex flex-col gap-2" style={{ "--i": i } as React.CSSProperties}>
                    <Link href={`/cuentas/${account.id}`} className="block transition-transform hover:-translate-y-1" aria-label={`Ver ${account.name}`}>
                      <AccountCard account={account} balance={Math.max(0, balance)} caption={holdsMoney(account) ? "Saldo" : "Lo que debes"}>
                        {kind === "credit_card" && account.credit_limit ? <UsageBar usage={Math.max(0, balance) / account.credit_limit} onCard /> : null}
                      </AccountCard>
                    </Link>
                    <div className="flex items-center justify-between px-1 text-sm">
                      <Link href={`/cuentas/${account.id}#editar`} className="font-medium text-brand">
                        Editar y personalizar
                      </Link>
                      <details className="relative">
                        <summary className="cursor-pointer list-none text-ink-3 hover:text-ink">Eliminar</summary>
                        <form action={deleteAccount} className="card absolute right-0 z-10 mt-2 flex w-64 flex-col items-start gap-2 p-4">
                          <input type="hidden" name="id" value={account.id} />
                          <p className="text-sm text-ink-2">Se borran también sus movimientos ({formatCOP(Math.abs(balance))} de saldo).</p>
                          <button className="btn-quiet">Sí, eliminar</button>
                        </form>
                      </details>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

    </>
  );
}
