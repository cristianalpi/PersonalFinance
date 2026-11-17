"use client";

import { useActionState } from "react";
import { saveBill, type FormState } from "@/app/actions";
import { MoneyInput } from "./money-input";

export function BillForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(saveBill, {});
  return (
    <form action={action} className="card flex flex-col gap-4">
      <h2 className="display text-2xl">Nuevo pago fijo</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="field">
          Nombre
          <input className="input" name="name" placeholder="Internet, arriendo, Netflix…" required />
        </label>
        <label className="field">
          Valor (vacío si cambia cada mes)
          <MoneyInput name="amount" placeholder="$ 90.000" />
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
