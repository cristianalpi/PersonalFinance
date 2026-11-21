"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/submit-button";
import { requestPasswordReset, type FormState } from "../actions";

export function ResetForm() {
  const [state, action] = useActionState<FormState, FormData>(requestPasswordReset, {});
  return (
    <form action={action} className="card flex flex-col gap-4">
      <label className="field">
        Correo
        <input className="input" type="email" name="email" autoComplete="email" required />
      </label>
      {state.error && <p role="alert" className="alert">{state.error}</p>}
      {state.message && <p role="status" className="text-sm text-ink-2">{state.message}</p>}
      <SubmitButton className="btn">Enviarme el enlace</SubmitButton>
    </form>
  );
}
