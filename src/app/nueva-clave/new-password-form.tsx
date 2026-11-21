"use client";

import { useActionState } from "react";
import { updatePassword, type FormState } from "../actions";

export function NewPasswordForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(updatePassword, {});
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
      <button className="btn" disabled={pending}>
        Guardar y entrar
      </button>
    </form>
  );
}
