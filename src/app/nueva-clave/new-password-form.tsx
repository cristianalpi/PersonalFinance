"use client";

import { useActionState } from "react";
import { FormSplash } from "@/components/splash";
import { SubmitButton } from "@/components/submit-button";
import { updatePassword, type FormState } from "../actions";

export function NewPasswordForm() {
  const [state, action] = useActionState<FormState, FormData>(updatePassword, {});
  return (
    <form action={action} className="card flex flex-col gap-4">
      <label className="field">
        Contraseña nueva
        <input className="input" type="password" name="password" autoComplete="new-password" minLength={6} required />
      </label>
      <label className="field">
        Repítela
        <input className="input" type="password" name="repeat" autoComplete="new-password" minLength={6} required />
      </label>
      {state.error && <p role="alert" className="alert">{state.error}</p>}
      <SubmitButton className="btn">Guardar y entrar</SubmitButton>
      <FormSplash text="Guardando tu contraseña…" />
    </form>
  );
}
