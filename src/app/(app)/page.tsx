import Link from "next/link";
import { BalanceBeam } from "@/components/balance-beam";
import { BalanceChart, HAVE_OWE } from "@/components/balance-chart";
import { DebtDescent } from "@/components/debt-descent";
import { Sparkline } from "@/components/sparkline";
import { advise, type Advice } from "@/lib/advice";
import { loadData } from "@/lib/data";
import { balanceAt, billStatus, daysBetween, formatCOP, isDebt, monthlySeries, nextDueDate, relativeDay, spendingByCategory, totals } from "@/lib/finance";

const LEVEL = { urgent: "Urgente", warn: "Atención", idea: "Idea" };
const VISIBLE = 4; // the most pressing recommendations; the rest stay one tap away

const adviceCard = (item: Advice) => (
  <li key={item.id} className={`rounded-2xl border bg-surface p-5 ${item.level === "urgent" ? "border-ink" : "border-line"}`}>
    <p className={`text-xs font-medium ${item.level === "urgent" ? "text-ink" : "text-ink-3"}`}>{LEVEL[item.level]}</p>
    <p className="mt-1 font-medium">{item.title}</p>
    <p className="mt-1 text-sm text-ink-2">{item.detail}</p>
  </li>
);

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export default async function Dashboard() {
  const { accounts, txs, bills, inbox, today } = await loadData();

  if (accounts.length === 0) {
    return (
      <section className="max-w-xl pt-6">
        <h1 className="display text-4xl">Empieza por lo que tienes y lo que debes</h1>
        <p className="mt-3 text-ink-2">
          Registra tus cuentas de ahorros, tarjetas y créditos con el saldo de hoy. Desde ahí, cada pago y cada gasto mueve el balance.
        </p>
        <Link href="/cuentas" className="btn mt-5">
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
  const spending = spendingByCategory(txs, today.slice(0, 7));
  const spent = spending.reduce((sum, c) => sum + c.amount, 0);
  const advice = advise(accounts, txs, today, bills);
  const debts = accounts.filter(isDebt);
  const savings = accounts.filter((a) => !isDebt(a));

  const upcoming = [
    ...debts
      .filter((a) => a.due_day && balanceAt(a, txs) > 0)
      .map((a) => {
        const date = nextDueDate(a.due_day!, today);
        return { id: a.id, name: a.name, date, days: daysBetween(today, date), amount: a.monthly_payment ?? balanceAt(a, txs), paid: false };
      }),
    ...bills.map((b) => {
      const status = billStatus(b, txs, today);
      return { id: b.id, name: b.name, date: status.date, days: status.days, amount: b.amount, paid: status.paidThisMonth };
    }),
  ].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <>
      <BalanceBeam savings={now.savings} debt={now.debt} previousNet={previous ? previous.net : null} />

      {inbox.length > 0 && (
        <Link href="/movimientos" className="flex items-center justify-between gap-3 rounded-2xl border border-ink bg-surface px-5 py-4 text-sm">
          <span>
            {inbox.length === 1 ? "Hay 1 pago de Apple Wallet" : `Hay ${inbox.length} pagos de Apple Wallet`} por revisar. No cuentan en tus saldos todavía.
          </span>
          <span className="shrink-0 font-medium underline underline-offset-4">Revisar</span>
        </Link>
      )}

      {advice.length > 0 && (
        <section aria-labelledby="advice-title">
          <h2 id="advice-title" className="display text-2xl">
            Qué hacer ahora
          </h2>
          <ul className="mt-3 grid gap-3 md:grid-cols-2">{advice.slice(0, VISIBLE).map(adviceCard)}</ul>
          {advice.length > VISIBLE && (
            <details className="mt-3">
              <summary className="cursor-pointer text-sm text-ink-2 underline underline-offset-4">
                Ver {advice.length - VISIBLE} {advice.length - VISIBLE === 1 ? "recomendación más" : "recomendaciones más"}
              </summary>
              <ul className="mt-3 grid gap-3 md:grid-cols-2">{advice.slice(VISIBLE).map(adviceCard)}</ul>
            </details>
          )}
        </section>
      )}

      <div className="grid gap-5 lg:grid-cols-5 lg:gap-6">
        {debts.length > 0 && (
          <section className="card lg:col-span-3" aria-labelledby="debts-title">
            <h2 id="debts-title" className="display text-2xl">
              Tus deudas, bajando
            </h2>
            <ul className="mt-1 divide-y divide-line">
              {debts.map((account) => (
                <DebtDescent key={account.id} account={account} balance={balanceAt(account, txs)} />
              ))}
            </ul>
          </section>
        )}

        <section className={`card ${debts.length > 0 ? "lg:col-span-2" : "lg:col-span-5"}`} aria-labelledby="upcoming-title">
          <h2 id="upcoming-title" className="display text-2xl">
            Próximos pagos
          </h2>
          {upcoming.length === 0 ? (
            <p className="mt-2 text-sm text-ink-3">Agrega el día de pago a tus tarjetas y créditos, o registra tus recibos, para verlos aquí.</p>
          ) : (
            <ol className="mt-3 flex flex-col gap-3">
              {upcoming.map((item) => (
                <li key={item.id} className="flex items-center gap-3">
                  {/* A calendar leaf: the date is the thing to read first. */}
                  <span className={`flex w-12 shrink-0 flex-col items-center rounded-lg border py-1 leading-tight ${item.days < 0 && !item.paid ? "border-ink bg-ink text-bg" : "border-line"}`}>
                    <span className="display text-lg">{Number(item.date.slice(8, 10))}</span>
                    <span className="text-[11px]">{MONTHS[Number(item.date.slice(5, 7)) - 1]}</span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{item.name}</p>
                    <p className="text-sm text-ink-3">{item.paid ? "Pagado este mes" : relativeDay(item.days)}</p>
                  </div>
                  <p className="num shrink-0 text-sm">{item.amount ? formatCOP(item.amount) : "Variable"}</p>
                </li>
              ))}
            </ol>
          )}
          <p className="mt-4 text-xs text-ink-3">En créditos se muestra la cuota; en tarjetas, la deuda total.</p>
        </section>
      </div>

      <section className="card" aria-labelledby="trend-title">
        <h2 id="trend-title" className="display text-2xl">
          Lo que tienes y lo que debes, mes a mes
        </h2>
        <p className="mb-3 text-sm text-ink-3">Saldo al cierre de cada mes. El mes actual va hasta hoy.</p>
        <BalanceChart data={started.map(({ label, savings: s, debt }) => ({ label, savings: s, debt }))} series={HAVE_OWE} />
        <details className="mt-3 text-sm text-ink-2">
          <summary className="cursor-pointer">Ver como tabla</summary>
          <table className="mt-2 w-full text-right">
            <thead>
              <tr className="text-ink-3">
                <th className="text-left font-normal">Mes</th>
                <th className="font-normal">Tienes</th>
                <th className="font-normal">Debes</th>
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

      <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
        {savings.length > 0 && (
          <section className="card" aria-labelledby="savings-title">
            <h2 id="savings-title" className="display text-2xl">
              Donde está tu plata
            </h2>
            <ul className="mt-1 divide-y divide-line">
              {savings.map((account) => (
                <li key={account.id}>
                  <Link href={`/cuentas/${account.id}`} className="group flex items-center justify-between gap-3 py-4">
                    <div className="min-w-0">
                      <p className="truncate font-medium group-hover:underline group-hover:underline-offset-4">{account.name}</p>
                      <p className="display text-xl">{formatCOP(balanceAt(account, txs))}</p>
                    </div>
                    <Sparkline values={series.map((p) => p.byAccount[account.id])} color="var(--savings)" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="card" aria-labelledby="spend-title">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="spend-title" className="display text-2xl">
              Gastos del mes
            </h2>
            <p className="display text-xl">{formatCOP(spent)}</p>
          </div>
          {spending.length === 0 ? (
            <p className="mt-2 text-sm text-ink-3">Todavía no hay gastos este mes.</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
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
          <p className="mt-4 text-sm">
            <Link href="/movimientos" className="underline underline-offset-4">
              Ver todos los movimientos
            </Link>
          </p>
        </section>
      </div>
    </>
  );
}
