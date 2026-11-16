import Link from "next/link";
import { deleteTx } from "@/app/actions";
import { TxForm } from "@/components/tx-form";
import { loadData } from "@/lib/data";
import { formatCOP, formatDate, type Tx } from "@/lib/finance";

const SHOWN = 100;

export default async function TransactionsPage() {
  const { accounts, txs, today } = await loadData();
  const nameOf = new Map(accounts.map((a) => [a.id, a.name]));

  if (accounts.length === 0) {
    return (
      <section className="card flex flex-col items-start gap-3">
        <h1 className="text-xl font-semibold">Primero registra una cuenta</h1>
        <Link href="/cuentas" className="btn">
          Ir a cuentas
        </Link>
      </section>
    );
  }

  const title = (tx: Tx) =>
    tx.kind === "payment"
      ? `Pago a ${nameOf.get(tx.account_id)}`
      : tx.kind === "income"
        ? "Ingreso"
        : (tx.category ?? "Gasto");

  const detail = (tx: Tx) =>
    [
      formatDate(tx.occurred_on),
      tx.kind === "payment"
        ? tx.source_account_id
          ? `desde ${nameOf.get(tx.source_account_id)}`
          : null
        : nameOf.get(tx.account_id),
      tx.description,
      tx.source === "wallet" ? "Apple Wallet" : null,
    ]
      .filter(Boolean)
      .join(" · ");

  return (
    <>
      <h1 className="text-2xl font-semibold">Movimientos</h1>
      <TxForm accounts={accounts.map(({ id, name, kind }) => ({ id, name, kind }))} today={today} />
      <section className="card">
        <h2 className="eyebrow">Recientes</h2>
        {txs.length === 0 ? (
          <p className="mt-2 text-sm text-ink-3">Aún no hay movimientos.</p>
        ) : (
          <ul className="mt-2 divide-y divide-line">
            {txs.slice(0, SHOWN).map((tx) => (
              <li key={tx.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{title(tx)}</p>
                  <p className="truncate text-sm text-ink-3">{detail(tx)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <p className="num">
                    {tx.kind === "income" ? "+" : "−"}
                    {formatCOP(tx.amount)}
                  </p>
                  <form action={deleteTx}>
                    <input type="hidden" name="id" value={tx.id} />
                    <button className="text-sm text-ink-3 hover:text-ink" aria-label={`Eliminar ${title(tx)} del ${formatDate(tx.occurred_on)}`}>
                      ✕
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
        {txs.length > SHOWN && (
          <p className="mt-3 text-sm text-ink-3">
            Se muestran los {SHOWN} más recientes de {txs.length}.
          </p>
        )}
      </section>
    </>
  );
}
