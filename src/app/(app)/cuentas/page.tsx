import Link from "next/link";
import { AccountCard } from "@/components/account-card";
import { AddAccount } from "@/components/add-account";
import { AddTile } from "@/components/add-tile";
import { Carousel, Slide } from "@/components/carousel";
import { UsageBar } from "@/components/usage-bar";
import { loadData } from "@/lib/data";
import { balanceAt, holdsMoney, type AccountKind } from "@/lib/finance";

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


      {GROUPS.map(({ kind, title }) => {
        const group = accounts.filter((a) => a.kind === kind);
        return (
          <section key={kind} aria-label={title}>
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="display text-2xl">{title}</h2>
              {group.length > 1 && <p className="text-sm text-ink-3">{group.length} cuentas · desliza para ver más</p>}
            </div>
            <div className="mt-3">
              <Carousel label={title}>
                {group.map((account, i) => {
                  const balance = balanceAt(account, txs);
                  return (
                    <Slide key={account.id} index={i}>
                      <div className="flex flex-col gap-2">
                        <Link href={`/cuentas/${account.id}`} className="block transition-transform hover:-translate-y-1" aria-label={`Ver ${account.name}`}>
                          <AccountCard account={account} balance={Math.max(0, balance)} caption={holdsMoney(account) ? "Saldo" : "Lo que debes"}>
                            {kind === "credit_card" && account.credit_limit ? <UsageBar usage={Math.max(0, balance) / account.credit_limit} onCard /> : null}
                          </AccountCard>
                        </Link>
                        <Link href={`/cuentas/${account.id}#editar`} className="px-1 text-sm font-medium text-brand">
                          Editar y personalizar
                        </Link>
                      </div>
                    </Slide>
                  );
                })}
                <Slide index={group.length}>
                  <AddTile kind={kind} />
                </Slide>
              </Carousel>
            </div>
          </section>
        );
      })}
    </>
  );
}
