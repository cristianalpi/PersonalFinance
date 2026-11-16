import Link from "next/link";
import { AnimatedNumber } from "@/components/animated-number";
import { BalanceChart } from "@/components/balance-chart";
import { Sparkline } from "@/components/sparkline";
import { advise } from "@/lib/advice";
import { loadData } from "@/lib/data";
import {
  KIND_LABEL,
  balanceAt,
  billStatus,
  daysBetween,
  formatCOP,
  formatDate,
  isDebt,
  monthlySeries,
  nextDueDate,
  relativeDay,
  spendingByCategory,
  totals,
} from "@/lib/finance";

function Delta({ now, before }: { now: number; before: number | null }) {
  if (before === null) return null; // nothing was registered a month ago, so there is no change to report
  const diff = now - before;
  if (diff === 0) return <p className="text-sm text-ink-3">Sin cambios este mes</p>;
  return (
    <p className="text-sm text-ink-2">
      <span aria-hidden="true">{diff > 0 ? "↑" : "↓"}</span> {diff > 0 ? "Subió" : "Bajó"}{" "}
      <span className="num">{formatCOP(Math.abs(diff))}</span> este mes
    </p>
  );
}

export default async function Dashboard() {
  const { accounts, txs, bills, inbox, today } = await loadData();

  if (accounts.length === 0) {
    return (
      <section className="card flex flex-col items-start gap-3">
        <h1 className="text-xl font-semibold">Empieza por tus cuentas</h1>
        <p className="text-ink-2">
          Registra tus cuentas de ahorros, tarjetas y créditos con el saldo de hoy. Desde ahí cada pago y cada gasto mueve
          el balance.
        </p>
        <Link href="/cuentas" className="btn">
          Agregar la primera cuenta
        </Link>
      </section>
    );
  }

  const now = totals(accounts, txs);
  const series = monthlySeries(accounts, txs, today, 12);
  // Months before the first account existed have no balance; drawing them as $0 would fake a jump.
  const started = series.filter((p) => Object.values(p.byAccount).some((v) => v !== null));
  const lastMonth = series[series.length - 2];
  const previous = started.includes(lastMonth) ? lastMonth : null;
  const month = today.slice(0, 7);
  const spending = spendingByCategory(txs, month);
  const spent = spending.reduce((sum, c) => sum + c.amount, 0);

  const advice = advise(accounts, txs, today, bills);
  const upcoming = [
    ...accounts
      .filter((a) => isDebt(a) && a.due_day && balanceAt(a, txs) > 0)
      .map((a) => {
        const date = nextDueDate(a.due_day!, today);
        return { id: a.id, name: a.name, date, days: daysBetween(today, date), amount: a.monthly_payment ?? balanceAt(a, txs), note: null as string | null };
      }),
    ...bills.map((b) => {
      const status = billStatus(b, txs, today);
      return { id: b.id, name: b.name, date: status.date, days: status.days, amount: b.amount, note: status.paidThisMonth ? "pagado este mes" : null };
    }),
  ].sort((a, b) => a.date.localeCompare(b.date));
  const LEVEL = { urgent: "Urgente", warn: "Atención", idea: "Idea" };

  return (
    <>
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="card sm:col-span-3">
          <p className="eyebrow">Balance general</p>
          <p className="num mt-2 text-4xl font-semibold sm:text-5xl">
            <AnimatedNumber value={now.net} from={previous ? previous.net : now.net} />
          </p>
          <div className="mt-2">
            <Delta now={now.net} before={previous ? previous.net : null} />
          </div>
        </div>
        <div className="card">
          <p className="eyebrow">Ahorros</p>
          <p className="num mt-2 text-2xl font-semibold">
            <AnimatedNumber value={now.savings} from={previous ? previous.savings : now.savings} />
          </p>
          <Delta now={now.savings} before={previous ? previous.savings : null} />
        </div>
        <div className="card">
          <p className="eyebrow">Deuda total</p>
          <p className="num mt-2 text-2xl font-semibold">
            <AnimatedNumber value={now.debt} from={previous ? previous.debt : now.debt} />
          </p>
          <Delta now={now.debt} before={previous ? previous.debt : null} />
        </div>
        <div className="card">
          <p className="eyebrow">Gastado este mes</p>
          <p className="num mt-2 text-2xl font-semibold">{formatCOP(spent)}</p>
          <p className="text-sm text-ink-3">{spending.length ? `${spending.length} categorías` : "Sin gastos registrados"}</p>
        </div>
      </section>

      {inbox.length > 0 && (
        <Link href="/movimientos" className="card flex items-center justify-between gap-3 text-sm hover:border-ink-3">
          <span>
            <span className="font-medium">{inbox.length === 1 ? "1 pago de Apple Wallet" : `${inbox.length} pagos de Apple Wallet`}</span> por revisar
          </span>
          <span aria-hidden="true">→</span>
        </Link>
      )}

      {advice.length > 0 && (
        <section className="card">
          <h2 className="font-semibold">Recomendaciones</h2>
          <ul className="mt-2 divide-y divide-line">
            {advice.map((item, i) => (
              <li key={item.id} className="rise flex gap-3 py-3" style={{ "--i": i } as React.CSSProperties}>
                <span
                  className={`mt-0.5 h-fit shrink-0 rounded-full border px-2 py-0.5 text-xs ${
                    item.level === "urgent" ? "border-ink bg-ink text-bg" : item.level === "warn" ? "border-ink-2 text-ink" : "border-line text-ink-2"
                  }`}
                >
                  {LEVEL[item.level]}
                </span>
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-ink-2">{item.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card">
        <h2 className="font-semibold">Ahorros y deuda mes a mes</h2>
        <p className="mb-3 text-sm text-ink-3">Saldo al cierre de cada mes, hasta 12 meses atrás; el mes actual va hasta hoy.</p>
        <BalanceChart data={started.map(({ label, savings, debt }) => ({ label, savings, debt }))} />
        <details className="mt-3 text-sm text-ink-2">
          <summary className="cursor-pointer">Ver como tabla</summary>
          <table className="mt-2 w-full text-right">
            <thead>
              <tr className="text-ink-3">
                <th className="text-left font-normal">Mes</th>
                <th className="font-normal">Ahorros</th>
                <th className="font-normal">Deuda</th>
              </tr>
            </thead>
            <tbody>
              {started.map((p) => (
                <tr key={p.month} className="border-t border-line">
                  <td className="py-1 text-left">{p.label}</td>
                  <td className="num">{formatCOP(p.savings)}</td>
                  <td className="num">{formatCOP(p.debt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {accounts.map((account) => {
          const balance = balanceAt(account, txs);
          const debt = isDebt(account);
          const paid = debt && account.opening_balance > 0 ? account.opening_balance - balance : 0;
          const usage = account.credit_limit ? Math.min(1, Math.max(0, balance / account.credit_limit)) : null;
          return (
            <article key={account.id} className="card flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="eyebrow">
                    {KIND_LABEL[account.kind]}
                    {account.institution ? ` · ${account.institution}` : ""}
                  </p>
                  <h3 className="mt-1 font-semibold">{account.name}</h3>
                </div>
                <Sparkline values={series.map((p) => p.byAccount[account.id])} color={debt ? "var(--debt)" : "var(--savings)"} />
              </div>
              <p className="num text-2xl font-semibold">{formatCOP(balance)}</p>
              {debt && (
                <p className="text-sm text-ink-2">
                  {paid > 0 ? (
                    <>
                      Has bajado <span className="num">{formatCOP(paid)}</span> desde el {formatDate(account.opening_date)}
                    </>
                  ) : paid < 0 ? (
                    <>
                      Ha subido <span className="num">{formatCOP(-paid)}</span> desde el {formatDate(account.opening_date)}
                    </>
                  ) : (
                    "Sin cambios desde que la registraste"
                  )}
                </p>
              )}
              {usage !== null && (
                <div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-line" role="img" aria-label={`Cupo usado: ${Math.round(usage * 100)}%`}>
                    <div className="h-full rounded-full bg-debt" style={{ width: `${usage * 100}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-ink-3">
                    {Math.round(usage * 100)}% del cupo de <span className="num">{formatCOP(account.credit_limit!)}</span>
                  </p>
                </div>
              )}
            </article>
          );
        })}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="card">
          <h2 className="font-semibold">Próximos pagos</h2>
          {upcoming.length === 0 ? (
            <p className="mt-2 text-sm text-ink-3">Agrega el día de pago a tus tarjetas y créditos, o registra tus recibos, para verlos aquí.</p>
          ) : (
            <ul className="mt-2 divide-y divide-line">
              {upcoming.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className={item.days < 0 ? "font-medium text-ink" : "text-ink-3"}>
                      {formatDate(item.date)} · {relativeDay(item.days)}
                      {item.note ? ` · ${item.note}` : ""}
                    </p>
                  </div>
                  <p className="num">{item.amount ? formatCOP(item.amount) : "Valor variable"}</p>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-xs text-ink-3">Créditos: cuota mensual. Tarjetas: saldo total de la deuda. Recibos: su valor fijo.</p>
        </div>

        <div className="card">
          <h2 className="font-semibold">En qué se fue la plata este mes</h2>
          {spending.length === 0 ? (
            <p className="mt-2 text-sm text-ink-3">Todavía no hay gastos este mes.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-3">
              {spending.map((c) => (
                <li key={c.category} className="text-sm">
                  <div className="flex justify-between gap-3">
                    <span>{c.category}</span>
                    <span className="num">{formatCOP(c.amount)}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-line">
                    <div className="h-full rounded-full bg-ink-2" style={{ width: `${(c.amount / spending[0].amount) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
