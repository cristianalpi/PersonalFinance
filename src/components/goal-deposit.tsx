"use client";

import { useActionState, useState } from "react";
import { addDeposit, type FormState } from "@/app/actions";
import { MoneyInput } from "./money-input";
import { SubmitButton } from "./submit-button";

/** Add (or take out) money from a savings goal, right on its card. */
export function GoalDeposit({ goalId, suggested }: { goalId: string; suggested: number }) {
  const [state, action] = useActionState<FormState, FormData>(addDeposit, {});
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="btn h-10" onClick={() => setOpen(true)}>
          + Abonar
        </button>
        {state.message && <span className="rise text-sm font-semibold">✓ {state.message}</span>}
        {state.error && <p role="alert" className="alert w-full">{state.error}</p>}
      </div>
    );
  }
  return (
    <form
      action={async (form) => {
        await action(form);
        setOpen(false);
      }}
      className="rise flex flex-col gap-2"
    >
      <input type="hidden" name="goal_id" value={goalId} />
      <div className="flex gap-2">
        <MoneyInput name="amount" defaultValue={suggested || null} required autoFocus label="Cuánto abonas" />
        <SubmitButton className="btn h-11 shrink-0">Guardar</SubmitButton>
      </div>
      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2 text-ink-3">
          <input type="checkbox" name="withdraw" /> Es un retiro
        </label>
        <button type="button" className="text-ink-3 hover:text-ink" onClick={() => setOpen(false)}>
          Cancelar
        </button>
      </div>
      {state.error && <p role="alert" className="alert">{state.error}</p>}
    </form>
  );
}
