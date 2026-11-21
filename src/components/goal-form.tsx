"use client";

import { useActionState, useEffect, useState } from "react";
import { saveGoal, type FormState } from "@/app/actions";
import { formatCOP } from "@/lib/finance";
import { useCloseModal } from "./modal";
import { Icon } from "./icons";
import { MoneyInput } from "./money-input";
import { SubmitButton } from "./submit-button";

const EMOJIS = ["🎯", "🛋️", "📱", "✈️", "🏍️", "🚗", "🏠", "🎓", "🎁", "💍", "🐶", "🛟"];

export interface DebtOption {
  id: string;
  name: string;
  balance: number;
}

/** New goal: save for something, or clear a debt, by a date. */
export function GoalForm({ debts, today }: { debts: DebtOption[]; today: string }) {
  const [state, action] = useActionState<FormState, FormData>(saveGoal, {});
  const close = useCloseModal();
  const [kind, setKind] = useState<"save" | "payoff">("save");
  const [emoji, setEmoji] = useState("🎯");
  const [debtId, setDebtId] = useState(debts[0]?.id ?? "");
  const debt = debts.find((d) => d.id === debtId);

  useEffect(() => {
    if (state.message) close();
  }, [state, close]);

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="emoji" value={kind === "save" ? emoji : "💳"} />
      {kind === "payoff" && <input type="hidden" name="start_balance" value={debt?.balance ?? 0} />}

      <div className="grid grid-cols-2 gap-2">
        {(
          [
            { k: "save", icon: "target" as const, tone: "tone-have", label: "Ahorrar para algo", hint: "Juntar un monto antes de una fecha" },
            { k: "payoff", icon: "card" as const, tone: "tone-owe", label: "Pagar una deuda", hint: "Dejarla en cero antes de una fecha" },
          ] as const
        ).map((o) => (
          <button
            key={o.k}
            type="button"
            aria-pressed={kind === o.k}
            onClick={() => setKind(o.k)}
            disabled={o.k === "payoff" && debts.length === 0}
            className="group flex flex-col items-start gap-1.5 rounded-2xl border border-line p-3 text-left transition hover:border-brand active:scale-[0.97] disabled:opacity-40 aria-pressed:border-brand aria-pressed:bg-brand/12"
          >
            <span className={`icon-tile ${o.tone}`}>
              <Icon name={o.icon} />
            </span>
            <span className="font-semibold">{o.label}</span>
            <span className="text-xs text-ink-3">{o.hint}</span>
          </button>
        ))}
      </div>

      {kind === "save" ? (
        <>
          <label className="field">
            ¿Para qué?
            <input className="input" name="name" placeholder="Armario nuevo" required />
          </label>
          <div className="field">
            Ícono
            <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Ícono de la meta">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  role="radio"
                  aria-checked={emoji === e}
                  onClick={() => setEmoji(e)}
                  className="flex size-10 items-center justify-center rounded-xl text-xl transition hover:bg-brand/10 aria-checked:bg-brand/20 aria-checked:ring-2 aria-checked:ring-brand"
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="field">
              ¿Cuánto cuesta?
              <MoneyInput name="target_amount" placeholder="$ 2.000.000" required />
            </label>
            <label className="field">
              ¿Para cuándo?
              <input className="input" type="date" name="target_date" min={today} required />
            </label>
          </div>
        </>
      ) : (
        <>
          <label className="field">
            ¿Qué deuda?
            <select className="input" name="account_id" value={debtId} onChange={(e) => setDebtId(e.target.value)} required>
              {debts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} · {formatCOP(d.balance)}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="field">
              Nombre de la meta
              <input className="input" name="name" defaultValue={debt ? `${debt.name} en cero` : ""} key={debtId} required />
            </label>
            <label className="field">
              ¿Para cuándo?
              <input className="input" type="date" name="target_date" min={today} required />
            </label>
          </div>
          <p className="text-sm text-ink-3">El avance se mide desde lo que debes hoy ({formatCOP(debt?.balance ?? 0)}), con cada pago que registres.</p>
        </>
      )}

      {state.error && <p role="alert" className="alert">{state.error}</p>}
      <SubmitButton className="btn h-12 text-base">{"Crear meta"}</SubmitButton>
    </form>
  );
}
