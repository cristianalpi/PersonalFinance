"use client";

import { useActionState, useState } from "react";
import { saveTx, type FormState } from "@/app/actions";
import { MoneyInput } from "./money-input";
import { allowedTxKinds, type Account, type TxKind } from "@/lib/finance";

const KIND_OPTIONS: { kind: TxKind; label: string }[] = [
  { kind: "expense", label: "Gasto o compra" },
  { kind: "payment", label: "Pago a tarjeta o crédito" },
  { kind: "income", label: "Ingreso" },
];

type AccountOption = Pick<Account, "id" | "name" | "kind">;

export function TxForm({ accounts, today }: { accounts: AccountOption[]; today: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveTx, {});
  const [kind, setKind] = useState<TxKind>("expense");
  const targets = accounts.filter((a) => allowedTxKinds(a.kind).includes(kind));
  const savings = accounts.filter((a) => a.kind === "savings");

  return (
    <form id="nuevo" action={action} className="card flex scroll-mt-4 flex-col gap-4">
      <h2 className="display text-2xl">Nuevo movimiento</h2>
      <fieldset className="flex flex-wrap gap-2">
        <legend className="sr-only">Tipo de movimiento</legend>
        {KIND_OPTIONS.map((option) => (
          <label
            key={option.kind}
            className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
              kind === option.kind ? "border-transparent bg-brand text-white" : "border-line text-ink-2"
            }`}
          >
            <input
              className="sr-only"
              type="radio"
              name="kind"
              value={option.kind}
              checked={kind === option.kind}
              onChange={() => setKind(option.kind)}
            />
            {option.label}
          </label>
        ))}
      </fieldset>

      {targets.length === 0 ? (
        <p className="text-sm text-ink-3">No tienes una cuenta a la que aplique este movimiento.</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="field">
              Monto
              <MoneyInput name="amount" placeholder="$ 85.000" required />
            </label>
            <label className="field">
              Fecha
              <input className="input" type="date" name="occurred_on" defaultValue={today} max={today} required />
            </label>
            {/* key: the option list changes with the kind, so the select starts fresh */}
            <label className="field" key={kind}>
              {kind === "payment" ? "Deuda que pagas" : kind === "income" ? "Cuenta que recibe" : "Con qué pagaste"}
              <select className="input" name="account_id" required>
                {targets.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </label>
            {kind === "payment" && (
              <label className="field">
                Sale de
                <select className="input" name="source_account_id">
                  <option value="">Otra fuente (no registrada)</option>
                  {savings.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {kind === "expense" && (
              <label className="field">
                Categoría
                <input className="input" name="category" list="categorias" defaultValue="Ocio" />
              </label>
            )}
            <label className="field">
              Nota
              <input className="input" name="description" placeholder="Opcional" />
            </label>
          </div>
          {state.error && <p role="alert" className="alert">{state.error}</p>}
          {state.message && <p role="status" className="text-sm text-ink-2">{state.message}</p>}
          <button className="btn self-start" disabled={pending}>
            {pending ? "Guardando…" : "Registrar"}
          </button>
        </>
      )}
    </form>
  );
}
