"use client";

import { useActionState, useState } from "react";
import { saveAccount, type FormState } from "@/app/actions";
import { KIND_LABEL, type AccountKind } from "@/lib/finance";
import { MoneyInput } from "./money-input";

const KINDS: AccountKind[] = ["savings", "credit_card", "loan"];

export function AccountForm({ today }: { today: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveAccount, {});
  const [kind, setKind] = useState<AccountKind>("savings");
  const debt = kind !== "savings";

  return (
    <form action={action} className="card flex flex-col gap-4">
      <h2 className="display text-2xl">Nueva cuenta</h2>
      <label className="field">
        Tipo
        <select className="input" name="kind" value={kind} onChange={(e) => setKind(e.target.value as AccountKind)}>
          {KINDS.map((k) => (
            <option key={k} value={k}>
              {KIND_LABEL[k]}
            </option>
          ))}
        </select>
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="field">
          Nombre
          <input className="input" name="name" placeholder={debt ? "Visa oro" : "Ahorros nómina"} required />
        </label>
        <label className="field">
          Banco o entidad
          <input className="input" name="institution" />
        </label>
        <label className="field">
          {debt ? "Cuánto debes hoy" : "Saldo hoy"}
          <MoneyInput name="opening_balance" placeholder="$ 1.500.000" required />
        </label>
        <label className="field">
          Fecha de ese saldo
          <input className="input" type="date" name="opening_date" defaultValue={today} max={today} required />
        </label>
        {kind === "credit_card" && (
          <>
            <label className="field">
              Cupo total
              <MoneyInput name="credit_limit" placeholder="$ 8.000.000" />
            </label>
            <label className="field">
              Día de corte
              <input className="input" type="number" name="statement_day" min={1} max={31} />
            </label>
          </>
        )}
        {kind === "loan" && (
          <>
            <label className="field">
              Cuota mensual
              <MoneyInput name="monthly_payment" placeholder="$ 780.000" />
            </label>
            <label className="field">
              Monto original del crédito (opcional)
              <MoneyInput name="original_amount" placeholder="$ 24.000.000" />
            </label>
          </>
        )}
        {debt && (
          <>
            <label className="field">
              Día límite de pago
              <input className="input" type="number" name="due_day" min={1} max={31} />
            </label>
            <label className="field">
              Tasa efectiva anual (%)
              <input className="input" name="annual_rate" inputMode="decimal" placeholder="24,5" />
            </label>
          </>
        )}
      </div>
      {state.error && <p role="alert" className="alert">{state.error}</p>}
      {state.message && <p role="status" className="text-sm text-ink-2">{state.message}</p>}
      <button className="btn self-start" disabled={pending}>
        {pending ? "Guardando…" : "Guardar cuenta"}
      </button>
    </form>
  );
}
