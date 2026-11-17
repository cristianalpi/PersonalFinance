"use client";

import { useMemo, useState } from "react";
import { formatCOP, monthLabel, shiftMonth } from "@/lib/finance";
import { simulate, type PlanDebt, type Strategy } from "@/lib/planner";
import { MoneyInput } from "./money-input";

const NAMES: Record<Strategy, { title: string; hint: string }> = {
  minimum: { title: "Solo mínimos", hint: "Lo que pasa si sigues igual" },
  avalanche: { title: "Avalancha", hint: "Lo extra a la tasa más alta" },
  snowball: { title: "Bola de nieve", hint: "Lo extra a la deuda más pequeña" },
};

/**
 * Compares three ways to pay off every debt, live as the person types how
 * much extra they can put in each month, and draws when each debt reaches zero.
 */
export function PlanSimulator({ debts, colors, startMonth }: { debts: PlanDebt[]; colors: Record<string, string>; startMonth: string }) {
  const [extra, setExtra] = useState(500_000);
  const [chosen, setChosen] = useState<Strategy>("avalanche");

  const results = useMemo(
    () => (["minimum", "avalanche", "snowball"] as const).map((s) => simulate(debts, s === "minimum" ? 0 : extra, s)),
    [debts, extra],
  );
  const base = results[0];
  const best = results.slice(1).reduce((a, b) => (a.totalInterest <= b.totalInterest ? a : b));
  const shown = results.find((r) => r.strategy === chosen)!;
  const horizon = Math.max(1, ...results.map((r) => r.months ?? 0), ...Object.values(shown.payoffMonth).map((m) => m ?? 0));
  const when = (n: number | null) => (n === null ? "Nunca, con estos pagos" : monthLabel(shiftMonth(startMonth, n)));
  const assumed = debts.filter((d) => d.assumedMin);
  const noRate = debts.filter((d) => d.annualRate === null);

  return (
    <section className="card flex flex-col gap-5" aria-labelledby="plan-title">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="plan-title" className="display text-2xl">
            Plan de pagos
          </h2>
          <p className="text-sm text-ink-3">Cuánto tardas en salir de todas tus deudas según cómo repartas la plata.</p>
        </div>
        <label className="field w-full sm:w-64">
          Puedo poner de más cada mes
          <MoneyInput name="extra" defaultValue={extra} onValue={setExtra} />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Estrategia">
        {results.map((r) => {
          const saved = base.totalInterest - r.totalInterest;
          return (
            <button
              key={r.strategy}
              type="button"
              role="radio"
              aria-checked={chosen === r.strategy}
              onClick={() => setChosen(r.strategy)}
              className="relative flex flex-col gap-1 rounded-2xl border border-line p-4 text-left transition hover:border-brand aria-checked:border-brand aria-checked:bg-brand/10"
            >
              {r === best && extra > 0 && <span className="pill pill-idea absolute right-3 top-3">Menos intereses</span>}
              <span className="font-semibold">{NAMES[r.strategy].title}</span>
              <span className="text-xs text-ink-3">{NAMES[r.strategy].hint}</span>
              <span className="mt-2 text-xs text-ink-3">Libre de deudas</span>
              <span className="display text-xl leading-tight">{when(r.months)}</span>
              <span className="text-sm text-ink-2">Intereses: {formatCOP(r.totalInterest)}</span>
              {r.strategy !== "minimum" && saved > 0 && <span className="text-sm font-semibold">Te ahorras {formatCOP(saved)}</span>}
            </button>
          );
        })}
      </div>

      <div>
        <p className="mb-3 text-sm font-semibold">Cuándo queda en cero cada deuda · {NAMES[chosen].title}</p>
        <ol className="flex flex-col gap-2.5">
          {[...debts]
            .sort((a, b) => (shown.payoffMonth[a.id] ?? 1e9) - (shown.payoffMonth[b.id] ?? 1e9))
            .map((d) => {
              const m = shown.payoffMonth[d.id];
              return (
                <li key={d.id} className="grid grid-cols-[minmax(0,9rem)_1fr] items-center gap-3 text-sm sm:grid-cols-[12rem_1fr]">
                  <span className="truncate font-medium">{d.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="track h-4 flex-1">
                      <div className="fill" style={{ width: `${m === null ? 100 : Math.max(3, (m / horizon) * 100)}%`, background: m === null ? "var(--debt)" : colors[d.id] }} />
                    </div>
                    <span className="num w-20 shrink-0 text-right text-xs font-semibold">{m === null ? "Nunca" : monthLabel(shiftMonth(startMonth, m))}</span>
                  </div>
                </li>
              );
            })}
        </ol>
      </div>

      <p className="text-xs text-ink-3">
        Estimado: intereses mensuales sobre el saldo de hoy, pagos mínimos fijos y sin compras nuevas.
        {assumed.length > 0 && ` Para ${assumed.map((d) => d.name).join(", ")} se asumió un mínimo del 5% (regístralo en la cuenta para afinar).`}
        {noRate.length > 0 && ` Sin tasa registrada (se calcula sin intereses): ${noRate.map((d) => d.name).join(", ")}.`}
      </p>
    </section>
  );
}
