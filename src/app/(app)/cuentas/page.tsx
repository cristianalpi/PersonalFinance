import { deleteAccount } from "@/app/actions";
import { AccountForm } from "@/components/account-form";
import { loadData } from "@/lib/data";
import { KIND_LABEL, balanceAt, formatCOP, formatDate, type AccountKind } from "@/lib/finance";

const ORDER: AccountKind[] = ["savings", "credit_card", "loan"];

export default async function AccountsPage() {
  const { accounts, txs, today } = await loadData();
  return (
    <>
      <h1 className="text-2xl font-semibold">Cuentas</h1>
      <AccountForm today={today} />
      {ORDER.map((kind) => {
        const group = accounts.filter((a) => a.kind === kind);
        if (group.length === 0) return null;
        return (
          <section key={kind} className="card">
            <h2 className="eyebrow">{KIND_LABEL[kind]}</h2>
            <ul className="mt-2 divide-y divide-line">
              {group.map((account) => (
                <li key={account.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-medium">{account.name}</p>
                    <p className="text-sm text-ink-3">
                      {[
                        account.institution,
                        `Saldo inicial ${formatCOP(account.opening_balance)} el ${formatDate(account.opening_date)}`,
                        account.due_day ? `Paga el día ${account.due_day}` : null,
                        account.annual_rate !== null ? `${account.annual_rate}% E.A.` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="num text-lg font-semibold">{formatCOP(balanceAt(account, txs))}</p>
                    <details className="relative text-sm">
                      <summary className="cursor-pointer text-ink-3 hover:text-ink">Eliminar</summary>
                      <form action={deleteAccount} className="mt-2 flex flex-col items-end gap-1">
                        <input type="hidden" name="id" value={account.id} />
                        <p className="text-xs text-ink-3">Se borran también sus movimientos.</p>
                        <button className="btn-quiet">Sí, eliminar</button>
                      </form>
                    </details>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}
