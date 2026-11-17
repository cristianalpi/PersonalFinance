import Link from "next/link";
import { balanceAt, holdsMoney, type Account, type AccountKind, type Tx } from "@/lib/finance";
import { AccountCard } from "./account-card";
import { AddTile } from "./add-tile";
import { Carousel, Slide } from "./carousel";
import { UsageBar } from "./usage-bar";

export const SHELF_TITLE: Record<AccountKind, string> = {
  savings: "Cuentas de ahorros",
  cash: "Efectivo",
  credit_card: "Tarjetas de crédito",
  loan: "Créditos",
};

/** One kind of account as a sideways carousel of cards, ending in a «+» tile for another of the same kind. */
export function AccountShelf({
  kinds,
  accounts,
  txs,
  title = SHELF_TITLE[kinds[0]],
  showTitle = true,
}: {
  kinds: AccountKind[];
  accounts: Account[];
  txs: Tx[];
  title?: string;
  showTitle?: boolean;
}) {
  const group = kinds.flatMap((k) => accounts.filter((a) => a.kind === k));
  return (
    <section aria-label={title}>
      {showTitle && (
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="display text-2xl">{title}</h2>
          {group.length > 1 && <p className="text-sm text-ink-3">{group.length} · desliza para ver más</p>}
        </div>
      )}
      <div>
        <Carousel label={title}>
          {group.map((account, i) => {
            const balance = balanceAt(account, txs);
            return (
              <Slide key={account.id} index={i}>
                <Link href={`/cuentas/${account.id}`} className="block transition-transform hover:-translate-y-1" aria-label={`Ver ${account.name}`}>
                  <AccountCard account={account} balance={Math.max(0, balance)} caption={holdsMoney(account) ? "Saldo" : "Lo que debes"} morph={account.id}>
                    {account.kind === "credit_card" && account.credit_limit ? <UsageBar usage={Math.max(0, balance) / account.credit_limit} onCard /> : null}
                  </AccountCard>
                </Link>
              </Slide>
            );
          })}
          {kinds.map((kind, i) => (
            <Slide key={kind} index={group.length + i}>
              <AddTile kind={kind} />
            </Slide>
          ))}
        </Carousel>
      </div>
    </section>
  );
}
