import { RATE_TYPE_LABEL, type RateType } from "@/lib/installments";

/**
 * "Cuota 14 de 36" with a bar of instalments: one segment each when they fit,
 * a continuous bar for long terms (a 20-year mortgage).
 */
export function InstallmentMeter({ paid, total, compact = false }: { paid: number; total: number; compact?: boolean }) {
  const left = total - paid;
  const segments = total <= 48;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-xs font-semibold">
        <span>{left === 0 ? "Todas las cuotas pagadas" : `Cuota ${paid + 1} de ${total}`}</span>
        <span className="num text-ink-3">{left === 0 ? "✓" : `faltan ${left}`}</span>
      </div>
      <div
        className={`mt-1.5 flex gap-[2px] ${compact ? "h-2" : "h-3"}`}
        role="meter"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={paid}
        aria-label={`${paid} de ${total} cuotas pagadas`}
      >
        {segments ? (
          Array.from({ length: total }, (_, i) => (
            <span
              key={i}
              className={`flex-1 first:rounded-l-full last:rounded-r-full ${i < paid ? "fill-have" : i === paid ? "bg-brand/45" : "track rounded-none"}`}
            />
          ))
        ) : (
          <span className="track h-full flex-1">
            <span className="fill fill-have block" style={{ width: `${Math.max(paid > 0 ? 2 : 0, (paid / total) * 100)}%` }} />
          </span>
        )}
      </div>
    </div>
  );
}

/** Small labels for what makes a debt less predictable: a variable rate and a refinanced term. */
export function DebtTags({ rateType, rateReference, refinanced }: { rateType?: RateType | null; rateReference?: string | null; refinanced?: boolean }) {
  if (!rateType && !refinanced) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {rateType && (
        <span className={`pill ${rateType === "variable" ? "pill-warn" : "pill-idea"}`} title={rateType === "variable" ? "La cuota puede cambiar" : "La cuota no cambia"}>
          {RATE_TYPE_LABEL[rateType]}
          {rateType === "variable" && rateReference ? ` · ${rateReference}` : ""}
        </span>
      )}
      {refinanced && (
        <span className="pill pill-urgent" title="El banco amplió el plazo">
          Rediferido
        </span>
      )}
    </div>
  );
}
