"use client";

import { useActionState } from "react";
import { authenticate, type FormState } from "../actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(authenticate, {});
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
        <button className="btn flex-1" name="intent" value="login" disabled={pending}>
          Entrar
        </button>
        <button className="btn-quiet" name="intent" value="signup" disabled={pending}>
          Crear cuenta
        </button>
      </div>
    </form>
  );
}
