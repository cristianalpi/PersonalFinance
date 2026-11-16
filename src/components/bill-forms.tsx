"use client";

import { useActionState } from "react";
import { payBill, saveBill, type FormState } from "@/app/actions";
import type { Bill } from "@/lib/finance";

export function BillForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(saveBill, {});
  return (
    <form action={action} className="card flex flex-col gap-4">
      <h2 className="font-semibold">Nuevo gasto fijo</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="field">
          Nombre
          <input className="input" name="name" placeholder="Internet, arriendo, Netflix…" required />
        </label>
        <label className="field">
          Valor (vacío si cambia cada mes)
          <input className="input num" name="amount" inputMode="numeric" placeholder="90.000" />
        </label>
        <label className="field">
          Día de pago
          <input className="input" type="number" name="due_day" min={1} max={31} required />
        </label>
        <label className="field">
          Categoría
          <input className="input" name="category" defaultValue="Hogar" />
        </label>
      </div>
      {state.error && <p role="alert" className="alert">{state.error}</p>}
      {state.message && <p role="status" className="text-sm text-ink-2">{state.message}</p>}
      <button className="btn self-start" disabled={pending}>
        {pending ? "Guardando…" : "Guardar"}
      </button>
    </form>
  );
}

export function PayBill({ bill, accounts, today }: { bill: Bill; accounts: { id: string; name: string }[]; today: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(payBill, {});
  return (
    <details className="w-full text-sm">
      <summary className="btn-quiet inline-flex cursor-pointer list-none">Marcar pagado</summary>
      <form action={action} className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
        <input type="hidden" name="bill_id" value={bill.id} />
        <label className="field">
          Cuánto pagaste
          <input className="input num" name="amount" inputMode="numeric" defaultValue={bill.amount ?? ""} required />
        </label>
        <label className="field">
          Con qué
          <select className="input" name="account_id" required>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Fecha
          <input className="input" type="date" name="occurred_on" defaultValue={today} max={today} required />
        </label>
        <button className="btn" disabled={pending}>
          Registrar pago
        </button>
      </form>
      {state.error && <p role="alert" className="alert mt-2">{state.error}</p>}
    </details>
  );
}
