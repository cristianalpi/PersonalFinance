"use client";

import { useActionState } from "react";
import { createToken, type FormState } from "@/app/actions";
import { SubmitButton } from "./submit-button";

/** Creates a token and shows it once. `render` turns the raw token into what the user copies. */
export function TokenCard({ kind, exists, origin }: { kind: "wallet" | "calendar"; exists: boolean; origin: string }) {
  const [state, action] = useActionState<FormState, FormData>(createToken, {});
  const value = state.token ? (kind === "calendar" ? `${origin}/api/calendar/${state.token}.ics` : state.token) : null;
  return (
    <div className="flex flex-col gap-3">
      {value ? (
        <>
          <p className="text-sm text-ink-2">
            {kind === "calendar" ? "Tu dirección de calendario" : "Tu token"}. Cópialo ahora: no se vuelve a mostrar.
          </p>
          <code className="block select-all break-all rounded-xl border border-line bg-surface/60 p-3 text-sm">{value}</code>
        </>
      ) : (
        <p className="text-sm text-ink-3">{exists ? "Ya hay uno activo. Si generas otro, el anterior deja de funcionar." : "Todavía no has generado uno."}</p>
      )}
      {state.error && <p role="alert" className="alert">{state.error}</p>}
      <form action={action}>
        <input type="hidden" name="kind" value={kind} />
        <SubmitButton className={exists || value ? "btn-quiet" : "btn"}>{exists || value ? "Generar uno nuevo" : "Generar"}</SubmitButton>
      </form>
    </div>
  );
}
