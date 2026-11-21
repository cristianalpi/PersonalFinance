"use client";

import { useState } from "react";
import type { RateType } from "@/lib/installments";

const RATE_OPTIONS: [RateType | "", string][] = [
  ["", "No sé"],
  ["fixed", "Fija"],
  ["variable", "Variable"],
];

/**
 * The detail of a card or loan, shared by "new account" and "edit": rate type (and what a variable
 * rate follows), whether it was refinanced and, for loans, the term and the instalments paid.
 */
export function CreditDetailFields({
  kind,
  termMonths = null,
  paid = null,
  rateType = null,
  rateReference = null,
  refinanced = false,
}: {
  kind: "credit_card" | "loan";
  termMonths?: number | null;
  paid?: number | null;
  rateType?: RateType | null;
  rateReference?: string | null;
  refinanced?: boolean;
}) {
  const [type, setType] = useState<RateType | "">(rateType ?? "");
  const [term, setTerm] = useState(termMonths ? String(termMonths) : "");
  const [done, setDone] = useState(paid !== null ? String(paid) : "");
  const isLoan = kind === "loan";
  const termN = Number(term);
  const doneN = Number(done || "0");
  const preview = isLoan && Number.isInteger(termN) && termN > 0 && doneN >= 0 && doneN <= termN ? { next: doneN + 1, left: termN - doneN } : null;

  return (
    <fieldset className="flex flex-col gap-4 rounded-2xl border border-line p-4">
      <legend className="px-1 text-sm font-semibold text-ink">{isLoan ? "Detalle del préstamo" : "Detalle de la tarjeta"}</legend>

      {isLoan && (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="field">
            Plazo total (número de cuotas)
            <input className="input num" type="number" name="term_months" min={1} max={600} inputMode="numeric" placeholder="60" value={term} onChange={(e) => setTerm(e.target.value)} />
          </label>
          <label className="field">
            Cuotas ya pagadas
            <input className="input num" type="number" name="installments_paid" min={0} max={termN || 600} inputMode="numeric" placeholder="14" value={done} onChange={(e) => setDone(e.target.value)} />
          </label>
          <p className="text-xs text-ink-3 sm:col-span-2">
            {preview
              ? preview.left === 0
                ? "Ya pagaste todas las cuotas."
                : `Vas en la cuota ${preview.next} de ${termN}: te faltan ${preview.left}.`
              : "Con el plazo y las cuotas pagadas ves en qué cuota vas y cuándo terminas. Lo encuentras en el extracto o en la app del banco."}
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <span className="field">Tipo de tasa</span>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Tipo de tasa">
          {RATE_OPTIONS.map(([value, label]) => (
            <label key={value || "none"} className="month-chip">
              <input type="radio" name="rate_type" value={value} checked={type === value} onChange={() => setType(value)} className="sr-only" />
              {label}
            </label>
          ))}
        </div>
        <p className="text-xs text-ink-3">
          {type === "fixed"
            ? "La tasa no cambia: la cuota es la misma hasta el final."
            : type === "variable"
              ? "La tasa sigue un indicador, así que la cuota puede subir o bajar."
              : isLoan
                ? "Fija: la cuota no cambia (lo común en libre inversión). Variable: sigue un indicador como IBR, DTF o UVR."
                : "Las tarjetas suelen tener tasa variable: el banco la ajusta cada mes."}
        </p>
      </div>

      {type === "variable" && (
        <label className="field">
          ¿Qué sigue la tasa? (opcional)
          <input className="input" name="rate_reference" maxLength={60} defaultValue={rateReference ?? ""} placeholder={isLoan ? "IBR + 6 puntos, DTF + 4, UVR + 7…" : "Tasa de usura, IBR + 12…"} />
        </label>
      )}

      <label className="check-row">
        <input type="checkbox" name="refinanced" defaultChecked={refinanced} />
        <span>
          <span className="font-medium text-ink">Está rediferido</span>
          <span className="block text-xs text-ink-3">
            {isLoan
              ? "El banco amplió el plazo: la cuota bajó, pero pagas más intereses en total. Si es así, pon arriba el plazo nuevo."
              : "Pasaste la deuda (o parte) a más cuotas. Ejemplo: una compra de 12 cuotas que el banco pasó a 36."}
          </span>
        </span>
      </label>
    </fieldset>
  );
}
