"use client";

import { useActionState } from "react";
import { FormSplash } from "@/components/splash";
import { SubmitButton } from "@/components/submit-button";
import { authenticate, type FormState } from "../actions";

export function LoginForm() {
  const [state, action] = useActionState<FormState, FormData>(authenticate, {});
  return (
    <form action={action} className="card flex flex-col gap-4">
      <label className="field">
        Correo
        <input className="input" type="email" name="email" autoComplete="email" required />
      </label>
      <label className="field">
        Contraseña
        <input className="input" type="password" name="password" autoComplete="current-password" minLength={6} required />
      </label>
      {state.error && <p role="alert" className="alert">{state.error}</p>}
      {state.message && <p role="status" className="text-sm text-ink-2">{state.message}</p>}
      <div className="flex gap-2">
        <SubmitButton className="btn flex-1" name="intent" value="login">
          Entrar
        </SubmitButton>
        <SubmitButton className="btn-quiet" name="intent" value="signup">
          Crear cuenta
        </SubmitButton>
      </div>
      {/* Stays up through the redirect, until the first screen of the app arrives. */}
      <FormSplash text="Abriendo tus finanzas…" intent="login" />
    </form>
  );
}
