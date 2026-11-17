import Link from "next/link";
import { notFound } from "next/navigation";
import { AccountCard } from "@/components/account-card";
import { AccountEditor } from "@/components/account-editor";
import { BalanceChart } from "@/components/balance-chart";
import { UsageBar } from "@/components/usage-bar";
import { OpenEditorFromHash } from "./open-editor";
import { TxList } from "@/components/tx-list";
import { loadData } from "@/lib/data";
import { balanceAt, formatCOP, formatDate, isDebt, monthlySeries, nextDueDate, relativeDay, daysBetween } from "@/lib/finance";

export default async function AccountPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { accounts, txs, today } = await loadData();
  const account = accounts.find((a) => a.id === id);
  if (!account) notFound();

  const debt = isDebt(account);
  const balance = balanceAt(account, txs);
  const points = monthlySeries([account], txs, today, 12)
    .filter((p) => p.byAccount[account.id] !== null)
    .map((p) => ({ label: p.label, balance: p.byAccount[account.id] }));
  const own = txs.filter((t) => t.account_id === account.id || t.source_account_id === account.id);
  const due = account.due_day ? nextDueDate(account.due_day, today) : null;

  const facts = [
    account.institution && ["Entidad", account.institution],
    account.credit_limit && ["Cupo", `${formatCOP(account.credit_limit)} (disponible ${formatCOP(Math.max(0, account.credit_limit - balance))})`],
    account.annual_rate !== null && ["Tasa", `${account.annual_rate.toLocaleString("es-CO")}% efectivo anual`],
    account.monthly_payment && ["Cuota mensual", formatCOP(account.monthly_payment)],
    account.statement_day && ["Día de corte", String(account.statement_day)],
    due && ["Próximo pago", `${formatDate(due)}, ${relativeDay(daysBetween(today, due))}`],
    account.wallet_card_name && ["En Apple Wallet", account.wallet_card_name],
    ["Registrada", `${formatDate(account.opening_date)} con ${formatCOP(account.opening_balance)}`],
  ].filter(Boolean) as [string, string][];

  return (
    <>
      <div className="flex flex-col gap-3 pt-2">
        <Link href={debt ? "/deudas" : "/cuentas"} className="text-sm font-medium text-brand">
          {debt ? "Deudas" : "Cuentas"}
        </Link>
        <h1 className="sr-only">{account.name}</h1>
        <AccountCard account={account} balance={Math.max(0, balance)} caption={debt ? "Lo que debes hoy" : "Lo que tienes hoy"} size="lg">
          {account.kind === "credit_card" && account.credit_limit ? <UsageBar usage={Math.max(0, balance) / account.credit_limit} onCard /> : null}
        </AccountCard>
      </div>

      <section className="card" aria-labelledby="account-trend">
        <h2 id="account-trend" className="display text-2xl">
          {debt ? "Cómo ha bajado" : "Cómo ha cambiado"}
        </h2>
        <p className="mb-3 text-sm text-ink-3">Saldo al cierre de cada mes. El mes actual va hasta hoy.</p>
        <BalanceChart data={points} series={[{ key: "balance", name: "Saldo", color: debt ? "var(--debt)" : "var(--savings)" }]} />
      </section>

      <section className="card">
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {facts.map(([term, value]) => (
            <div key={term}>
              <dt className="eyebrow">{term}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <details id="editar" className="card scroll-mt-4 [&[open]>summary]:mb-5">
        <summary className="display cursor-pointer text-2xl">Editar y personalizar</summary>
        <AccountEditor account={account} />
      </details>
      <OpenEditorFromHash />

      <h2 className="display text-2xl">Movimientos de esta cuenta</h2>
      <TxList txs={own} accountNames={Object.fromEntries(accounts.map((a) => [a.id, a.name]))} today={today} />
    </>
  );
}
