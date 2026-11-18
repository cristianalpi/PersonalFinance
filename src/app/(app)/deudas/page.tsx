import Link from "next/link";
import { AccountCard } from "@/components/account-card";
import { AddAccount } from "@/components/add-account";
import { AddTile } from "@/components/add-tile";
import { PlanSimulator } from "@/components/plan-simulator";
import { planDebts } from "@/lib/planner";
import { UsageBar } from "@/components/usage-bar";
import { cardColor } from "@/lib/banks";
import { loadData } from "@/lib/data";
import { debtView, payFirst, type DebtView } from "@/lib/debts";
import { formatCOP, formatDate, isDebt, relativeDay } from "@/lib/finance";

// Phones swipe sideways through the debts; wider screens lay them out in two columns.
const DEBT_ROW =
  "-mx-4 mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-3 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-2 md:gap-4 md:overflow-visible md:px-0 md:pb-0";
const DEBT_SLIDE = "w-[86%] shrink-0 snap-start md:w-auto";

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-ink-3">{label}</dt>
      <dd className="num font-semibold">{value}</dd>
    </div>
  );
}

function DebtModule({ view, first, index }: { view: DebtView; first: boolean; index: number }) {
  const { account } = view;
  const owed = Math.max(0, view.balance);
  return (
    <li className={`card rise flex flex-col gap-4 ${DEBT_SLIDE}`} style={{ "--i": index } as React.CSSProperties}>
      <Link href={`/cuentas/${account.id}`} className="block transition-transform hover:-translate-y-0.5" aria-label={`Ver ${account.name}`}>
        <AccountCard account={account} balance={owed} caption={view.usage !== null || account.kind === "credit_card" ? "Saldo de la deuda" : "Te falta por pagar"} morph={account.id} />
      </Link>

      <Link href={`/cuentas/${account.id}#saldo`} className="-mt-2 self-start text-sm font-medium text-brand">
        ↻ Actualizar saldo
      </Link>

      {first && (
        <p className="pill pill-idea self-start">
          <span aria-hidden="true">★</span>&nbsp;Abona aquí primero: es tu deuda más cara
        </p>
      )}

      {account.kind === "credit_card" &&
        (view.usage !== null ? (
          <div>
            <UsageBar usage={view.usage} />
            <p className="mt-1.5 text-sm text-ink-2">
              Disponible <span className="num font-semibold text-ink">{formatCOP(view.available!)}</span> de {formatCOP(account.credit_limit!)}
            </p>
          </div>
        ) : (
          <p className="text-sm text-ink-3">
            Agrega el cupo en{" "}
            <Link href={`/cuentas/${account.id}#editar`} className="font-medium text-brand">
              editar cuenta
            </Link>{" "}
            para ver el porcentaje de uso.
          </p>
        ))}

      {account.kind === "loan" && view.paidShare !== null && (
        <div>
          <div className="flex items-baseline justify-between text-xs font-semibold">
            <span>Llevas pagado</span>
            <span className="num">{Math.round(view.paidShare * 100)}%</span>
          </div>
          <div
            className="track mt-1.5 h-3"
            role="meter"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(view.paidShare * 100)}
            aria-label={`Pagado: ${Math.round(view.paidShare * 100)}%`}
          >
            <div className="fill fill-have" style={{ width: `${Math.max(view.paidShare > 0 ? 2 : 0, view.paidShare * 100)}%` }} />
          </div>
          <p className="mt-1.5 text-sm text-ink-2">
            {formatCOP(view.base! - owed)} pagados de {formatCOP(view.base!)}
            {view.baseIsOriginal ? "" : " desde que lo registraste"}.
            {!view.baseIsOriginal && (
              <>
                {" "}
                <Link href={`/cuentas/${account.id}#editar`} className="font-medium text-brand">
                  Agrega el monto original
                </Link>
              </>
            )}
          </p>
        </div>
      )}

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-line pt-4 sm:grid-cols-3">
        <Fact
          label="Próximo pago"
          value={view.nextDue ? `${formatDate(view.nextDue).replace(/ \d{4}$/, "")}, ${relativeDay(view.daysToDue!)}` : owed > 0 ? "Sin día de pago" : "Pagada"}
        />
        {account.kind === "loan" && <Fact label="Cuota" value={account.monthly_payment ? formatCOP(account.monthly_payment) : "—"} />}
        {account.kind === "loan" && view.monthsLeft !== null && <Fact label="Terminas" value={`${view.endsIn} (${view.monthsLeft} cuotas)`} />}
        <Fact label="Tasa" value={account.annual_rate !== null ? `${account.annual_rate.toLocaleString("es-CO")}% E.A.` : "—"} />
        {view.monthlyInterest !== null && <Fact label="Intereses al mes, aprox." value={formatCOP(view.monthlyInterest)} />}
      </dl>
    </li>
  );
}

export default async function DebtsPage({ searchParams }: { searchParams: Promise<{ nueva?: string }> }) {
  const { accounts, txs, today } = await loadData();
  const addNow = (await searchParams).nueva === "1";
  const planned = planDebts(accounts, txs);
  const colors = Object.fromEntries(accounts.map((a) => [a.id, cardColor(a)]));
  const views = accounts.filter(isDebt).map((a) => debtView(a, txs, today));
  const owing = views.filter((v) => v.balance > 0);
  const total = owing.reduce((sum, v) => sum + v.balance, 0);
  const interest = owing.reduce((sum, v) => sum + (v.monthlyInterest ?? 0), 0);
  const cards = views.filter((v) => v.account.kind === "credit_card");
  const loans = views.filter((v) => v.account.kind === "loan");
  const limit = cards.reduce((sum, v) => sum + (v.account.credit_limit ?? 0), 0);
  const used = cards.filter((v) => v.account.credit_limit).reduce((sum, v) => sum + Math.max(0, v.balance), 0);
  const first = payFirst(views);

  if (views.length === 0) {
    return (
      <section className="card max-w-xl">
        <h1 className="display text-3xl">Sin deudas registradas</h1>
        <p className="mt-2 text-ink-2">Cuando agregues una tarjeta de crédito o un crédito, aquí verás cuánto debes, cuánto cupo usas y cuánto te falta.</p>
        <div className="mt-4">
          <AddAccount today={today} autoOpen={addNow} defaultKind="credit_card" label="Agregar una tarjeta o crédito" />
        </div>
      </section>
    );
  }

  return (
    <>
      <AddAccount today={today} autoOpen={addNow} defaultKind="credit_card" label="Agregar deuda" buttonClass="btn-quiet h-10 gap-1.5 self-end px-4 text-sm -mb-3" />
      <section className="card" aria-labelledby="debts-total">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 id="debts-total" className="eyebrow">
              Debes en total
            </h1>
            <p className="display text-5xl leading-none sm:text-6xl">{formatCOP(total)}</p>
          </div>
          <dl className="flex flex-wrap gap-6">
            {interest > 0 && <Fact label="Intereses al mes, aprox." value={formatCOP(interest)} />}
            {limit > 0 && <Fact label="Cupo usado en tarjetas" value={`${Math.round((used / limit) * 100)}%`} />}
          </dl>
        </div>

        {/* Parts of a whole: each debt's share of the total, in its card colour, named in the legend. */}
        {owing.length > 1 && (
          <>
            <div className="mt-5 flex h-4 gap-1 overflow-hidden rounded-full" role="img" aria-label="Reparto de la deuda total por cuenta">
              {owing.map((v) => (
                <div key={v.account.id} className="fill first:rounded-l-full last:rounded-r-full" style={{ width: `${(v.balance / total) * 100}%`, background: cardColor(v.account) }} />
              ))}
            </div>
            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
              {owing.map((v) => (
                <li key={v.account.id} className="flex items-center gap-2">
                  <span aria-hidden="true" className="size-2.5 rounded-full" style={{ background: cardColor(v.account) }} />
                  <span className="font-medium">{v.account.name}</span>
                  <span className="num text-ink-3">
                    {formatCOP(v.balance)} ({Math.round((v.balance / total) * 100)}%)
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {cards.length > 0 && (
        <section aria-labelledby="cards-title">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="cards-title" className="display text-2xl">
              Tarjetas de crédito
            </h2>
            {cards.length > 1 && <p className="text-sm text-ink-3 md:hidden">{cards.length} · desliza</p>}
          </div>
          <ul className={DEBT_ROW}>
            {cards.map((v, i) => (
              <DebtModule key={v.account.id} view={v} first={v.account.id === first} index={i} />
            ))}
            <li className={`flex min-h-40 ${DEBT_SLIDE}`}>
              <AddTile kind="credit_card" />
            </li>
          </ul>
        </section>
      )}

      {loans.length > 0 && (
        <section aria-labelledby="loans-title">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="loans-title" className="display text-2xl">
              Créditos
            </h2>
            {loans.length > 1 && <p className="text-sm text-ink-3 md:hidden">{loans.length} · desliza</p>}
          </div>
          <ul className={DEBT_ROW}>
            {loans.map((v, i) => (
              <DebtModule key={v.account.id} view={v} first={v.account.id === first} index={cards.length + i} />
            ))}
            <li className={`flex min-h-40 ${DEBT_SLIDE}`}>
              <AddTile kind="loan" />
            </li>
          </ul>
        </section>
      )}

      {planned.length > 0 && (
        <div id="plan" className="scroll-mt-4">
          <PlanSimulator debts={planned} colors={colors} startMonth={today.slice(0, 7)} />
        </div>
      )}

      <p className="text-xs text-ink-3">
        Los intereses son un estimado sobre el saldo de hoy con la tasa que registraste. El extracto del banco manda.
      </p>
    </>
  );
}
