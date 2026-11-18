import Link from "next/link";
import { deleteGoal } from "@/app/actions";
import { GoalDeposit } from "@/components/goal-deposit";
import { GoalForm } from "@/components/goal-form";
import { Modal } from "@/components/modal";
import { Ring } from "@/components/ring";
import { loadData } from "@/lib/data";
import { balanceAt, formatCOP, formatDate, isDebt } from "@/lib/finance";
import { goalView, type GoalStatus, type GoalView } from "@/lib/goals";
import { SubmitButton } from "@/components/submit-button";

const STATUS: Record<GoalStatus, { label: string; pill: string }> = {
  done: { label: "¡Lograda! 🎉", pill: "pill-idea" },
  ahead: { label: "Vas adelantado", pill: "pill-idea" },
  on_track: { label: "Vas al día", pill: "pill-idea" },
  behind: { label: "Vas atrasado", pill: "pill-warn" },
  overdue: { label: "Se pasó la fecha", pill: "pill-urgent" },
};

function daysText(days: number) {
  if (days < 0) return `venció hace ${-days} días`;
  if (days === 0) return "es hoy";
  if (days < 60) return `faltan ${days} días`;
  return `faltan ${Math.round(days / 30.44)} meses`;
}

function GoalCard({ view, index }: { view: GoalView; index: number }) {
  const { goal } = view;
  const save = goal.kind === "save";
  const pct = Math.round(view.progress * 100);
  const behindBy = Math.max(0, Math.round(view.expected - view.achieved));
  return (
    <li className="card rise flex flex-col gap-4" style={{ "--i": index } as React.CSSProperties}>
      <div className="flex items-start gap-4">
        <Ring value={view.progress} label={`${pct}%`} sub={save ? "ahorrado" : "pagado"} gradient={save ? "brand" : "have"} />
        <div className="min-w-0 flex-1">
          <p className="text-3xl leading-none" aria-hidden="true">
            {goal.emoji ?? (save ? "🎯" : "💳")}
          </p>
          <h3 className="display mt-1 text-xl leading-tight">{goal.name}</h3>
          <p className="text-sm text-ink-3">
            {formatDate(goal.target_date)} · {daysText(view.daysLeft)}
          </p>
          <span className={`pill mt-2 ${STATUS[view.status].pill}`}>{STATUS[view.status].label}</span>
        </div>
      </div>

      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
          <span className="whitespace-nowrap">
            <span className="display num text-lg">{formatCOP(view.achieved)}</span> <span className="text-ink-3">de {formatCOP(view.target)}</span>
          </span>
          {view.remaining > 0 && <span className="whitespace-nowrap text-ink-3">faltan {formatCOP(view.remaining)}</span>}
        </div>
        <div className="track mt-1.5 h-3">
          <div className={`fill ${save ? "fill-brand" : "fill-have"}`} style={{ width: `${Math.max(view.progress > 0 ? 2 : 0, pct)}%` }} />
        </div>
      </div>

      {view.status !== "done" && view.daysLeft >= 0 && (
        <div className="rounded-2xl bg-brand/8 p-3">
          <p className="text-sm font-semibold">{save ? "Para llegar a tiempo, aparta:" : "Para dejarla en cero a tiempo, paga:"}</p>
          <dl className="mt-2 grid grid-cols-3 gap-1.5 text-center">
            {[
              ["al mes", view.perMonth],
              ["por quincena", view.perQuincena],
              ["por semana", view.perWeek],
            ].map(([label, value]) => (
              <div key={label as string} className="rounded-xl bg-surface/60 px-1 py-2">
                <dd className="display num text-[15px] leading-tight sm:text-lg">{formatCOP(value as number)}</dd>
                <dt className="text-[11px] leading-tight text-ink-3">{label}</dt>
              </div>
            ))}
          </dl>
          {view.status === "behind" && behindBy > 0 && (
            <p className="mt-2 text-sm text-ink-2">A este ritmo deberías llevar {formatCOP(Math.round(view.expected))}: te faltan {formatCOP(behindBy)} para ponerte al día.</p>
          )}
          {!save && view.account?.annual_rate == null && <p className="mt-2 text-xs text-ink-3">Sin tasa registrada: el cálculo no incluye intereses.</p>}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        {save ? (
          <GoalDeposit goalId={goal.id} suggested={view.perQuincena} />
        ) : (
          <Link href={`/cuentas/${goal.account_id}`} className="text-sm font-medium text-brand">
            Ver {view.account?.name ?? "la deuda"}
          </Link>
        )}
        <form action={deleteGoal}>
          <input type="hidden" name="id" value={goal.id} />
          <SubmitButton className="text-sm text-ink-3 hover:text-ink">Eliminar meta</SubmitButton>
        </form>
      </div>
    </li>
  );
}

export default async function GoalsPage() {
  const { accounts, txs, goals, deposits, goalsReady, today } = await loadData();
  const views = goals.map((g) => goalView(g, deposits, accounts, txs, today));
  const debts = accounts
    .filter(isDebt)
    .map((a) => ({ id: a.id, name: a.name, balance: Math.max(0, balanceAt(a, txs)) }))
    .filter((d) => d.balance > 0);
  const active = views.filter((v) => v.status !== "done");
  const monthly = active.filter((v) => v.daysLeft >= 0).reduce((sum, v) => sum + v.perMonth, 0);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div>
          <h1 className="display text-3xl">Metas</h1>
          <p className="text-sm text-ink-3">Lo que quieres lograr, con cuánto apartar para llegar a tiempo.</p>
        </div>
        <Modal title="Nueva meta" label={<><span aria-hidden="true" className="text-xl leading-none">+</span> Nueva meta</>}>
          <GoalForm debts={debts} today={today} />
        </Modal>
      </div>

      {!goalsReady && (
        <p className="alert">Para usar metas falta ejecutar la migración 0006 en el SQL Editor de Supabase.</p>
      )}

      {views.length === 0 ? (
        <section className="card max-w-xl">
          <p className="text-4xl" aria-hidden="true">
            🎯
          </p>
          <p className="display mt-2 text-xl">Aún no tienes metas</p>
          <p className="mt-1 text-ink-2">Por ejemplo: «Comprar un armario de $2.000.000 antes de febrero». Te digo cuánto apartar cada mes, quincena o semana.</p>
        </section>
      ) : (
        <>
          {monthly > 0 && (
            <section className="card flex flex-wrap items-center justify-between gap-3">
              <p className="text-ink-2">
                Para cumplir tus {active.length} {active.length === 1 ? "meta" : "metas"} a tiempo necesitas apartar en total
              </p>
              <p className="display text-3xl">{formatCOP(monthly)} al mes</p>
            </section>
          )}
          <ul className="grid gap-4 md:grid-cols-2">
            {views.map((v, i) => (
              <GoalCard key={v.goal.id} view={v} index={i} />
            ))}
          </ul>
        </>
      )}
    </>
  );
}
