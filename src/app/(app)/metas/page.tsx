import Link from "next/link";
import { GoalDeposit } from "@/components/goal-deposit";
import { GoalForm } from "@/components/goal-form";
import { GoalSummary } from "@/components/goal-summary";
import { LinkPending } from "@/components/link-pending";
import { Modal } from "@/components/modal";
import { loadData } from "@/lib/data";
import { balanceAt, formatCOP, formatDate, isDebt } from "@/lib/finance";
import { goalView, planOutlook, type GoalView } from "@/lib/goals";
import type { GoalDeposit as Deposit } from "@/lib/goals";

function GoalCard({ view, deposits, today, index }: { view: GoalView; deposits: Deposit[]; today: string; index: number }) {
  const { goal } = view;
  const save = goal.kind === "save";
  const outlook = planOutlook(view, deposits, today);
  const open = view.status !== "done" && view.daysLeft >= 0;
  const behindBy = Math.max(0, Math.round(view.expected - view.achieved));

  return (
    <li className="card rise relative flex flex-col gap-4" style={{ "--i": index } as React.CSSProperties}>
      <Link href={`/metas/${goal.id}`} className="relative flex flex-col gap-4 rounded-2xl transition-transform active:scale-[0.99]" aria-label={`Ver la meta ${goal.name}`}>
        <LinkPending />
        <GoalSummary view={view} />
      </Link>

      {open && (
        <div className="rounded-2xl bg-brand/8 p-3 text-sm">
          {outlook ? (
            <p>
              <span className="font-semibold">Plan:</span> {formatCOP(goal.plan_amount!)} el día {goal.plan_day} de cada mes
              {outlook.next ? `, el próximo el ${formatDate(outlook.next).replace(/ \d{4}$/, "")}` : ""}.{" "}
              {outlook.enough ? (
                <span className="text-ink-2">Llegas a tiempo.</span>
              ) : (
                <span className="font-medium text-ink">Te faltarían {formatCOP(outlook.shortfall)}.</span>
              )}
            </p>
          ) : save ? (
            <p>
              Para llegar a tiempo, aparta <span className="num font-semibold">{formatCOP(view.perMonth)}</span> al mes.{" "}
              <Link href={`/metas/${goal.id}#editar`} className="font-semibold text-brand">
                Programar el ahorro
              </Link>
            </p>
          ) : (
            <p>
              Para dejarlo en cero a tiempo, paga <span className="num font-semibold">{formatCOP(view.perMonth)}</span> al mes.
            </p>
          )}
          {view.status === "behind" && behindBy > 0 && <p className="mt-1 text-ink-2">Vas {formatCOP(behindBy)} por detrás del ritmo para llegar a tiempo.</p>}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        {save && open ? <GoalDeposit goalId={goal.id} suggested={goal.plan_amount ?? view.perMonth} /> : <span />}
        <Link href={`/metas/${goal.id}`} className="text-sm font-medium text-brand">
          Ver detalle ›
        </Link>
      </div>
    </li>
  );
}

export default async function GoalsPage() {
  const { accounts, txs, goals, deposits, incomes, goalsReady, today } = await loadData();
  const views = goals.map((g) => goalView(g, deposits, accounts, txs, today));
  const debts = accounts
    .filter(isDebt)
    .map((a) => ({ id: a.id, name: a.name, balance: Math.max(0, balanceAt(a, txs)) }))
    .filter((d) => d.balance > 0);
  const month = today.slice(0, 7);
  const incomeOptions = incomes.filter((i) => !i.once_month || i.once_month >= month).map(({ id, name, day }) => ({ id, name, day }));
  const active = views.filter((v) => v.status !== "done" && v.daysLeft >= 0);
  // What the goals take each month: the plan where there is one, else what it would take to arrive on time.
  const monthly = active.reduce((sum, v) => sum + (v.goal.plan_amount ?? v.perMonth), 0);
  const planned = active.filter((v) => v.goal.plan_amount).length;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div>
          <h1 className="display text-3xl">Metas</h1>
          <p className="text-sm text-ink-3">Lo que quieres lograr, con un plan para llegar a tiempo.</p>
        </div>
        <Modal title="Nueva meta" label={<><span aria-hidden="true" className="text-xl leading-none">+</span> Nueva meta</>}>
          <GoalForm debts={debts} incomes={incomeOptions} today={today} />
        </Modal>
      </div>

      {!goalsReady && <p className="alert">Para usar metas falta ejecutar la migración 0006 en el SQL Editor de Supabase.</p>}

      {views.length === 0 ? (
        <section className="card max-w-xl">
          <p className="text-4xl" aria-hidden="true">
            🎯
          </p>
          <p className="display mt-2 text-xl">Aún no tienes metas</p>
          <p className="mt-1 text-ink-2">
            Por ejemplo: «Un armario de $1.200.000 para el 30 de junio, abonando $150.000 de mi salario cada mes». Te aparece en Pagos para que no se te olvide.
          </p>
        </section>
      ) : (
        <>
          {monthly > 0 && (
            <section className="card flex flex-wrap items-center justify-between gap-3">
              <p className="text-ink-2">
                Tus {active.length} {active.length === 1 ? "meta toma" : "metas toman"}
                {planned > 0 && planned < active.length ? " (con plan o lo sugerido)" : ""}
              </p>
              <p className="display text-3xl">{formatCOP(monthly)} al mes</p>
            </section>
          )}
          <ul className="grid gap-4 md:grid-cols-2">
            {views.map((v, i) => (
              <GoalCard key={v.goal.id} view={v} deposits={deposits} today={today} index={i} />
            ))}
          </ul>
        </>
      )}
    </>
  );
}
