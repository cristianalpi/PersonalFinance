import { formatCOP } from "@/lib/finance";
import { AnimatedNumber } from "./animated-number";

/**
 * The page's opening picture: what you have and what you owe drawn as two
 * bars meeting at one point, on a track whose midpoint means "even". When the
 * meeting point sits right of the midpoint you have more than you owe.
 */
export function BalanceBeam({ savings, debt, previousNet }: { savings: number; debt: number; previousNet: number | null }) {
  const net = savings - debt;
  const total = savings + debt;
  const share = total > 0 ? savings / total : 0.5;
  const diff = previousNet === null ? null : net - previousNet;

  return (
    <section aria-labelledby="balance-title" className="pt-2 sm:pt-6">
      <h1 id="balance-title" className="eyebrow">
        Tu balance hoy
      </h1>
      <p className="display mt-1 text-5xl leading-none sm:text-7xl">
        <AnimatedNumber value={net} from={previousNet ?? net} />
      </p>
      <p className="mt-3 text-ink-2">
        {diff === null || diff === 0 ? (
          net >= 0 ? "Tienes más de lo que debes." : "Debes más de lo que tienes."
        ) : (
          <>
            {diff > 0 ? "Mejoró" : "Bajó"} <span className="num font-medium text-ink">{formatCOP(Math.abs(diff))}</span> frente al cierre del mes pasado.
          </>
        )}
      </p>

      <div className="mt-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Tienes</p>
            <p className="display text-2xl sm:text-3xl">{formatCOP(savings)}</p>
          </div>
          <div className="text-right">
            <p className="eyebrow">Debes</p>
            <p className="display text-2xl sm:text-3xl">{formatCOP(debt)}</p>
          </div>
        </div>
        <div
          className="relative mt-3"
          role="img"
          aria-label={`De cada 100 pesos entre lo que tienes y lo que debes, ${Math.round(share * 100)} son tuyos y ${100 - Math.round(share * 100)} son deuda.`}
        >
          <div className="flex h-4 gap-0.5">
            <div className="overflow-hidden" style={{ width: `${share * 100}%` }}>
              <div className="grow-left h-full rounded-l-full bg-savings" />
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="grow-right h-full rounded-r-full bg-debt" />
            </div>
          </div>
          <div className="absolute -top-1.5 left-1/2 h-7 w-px bg-ink" aria-hidden="true" />
        </div>
        <p className="mt-2 text-center text-xs text-ink-3">La línea marca el punto de equilibrio</p>
      </div>
    </section>
  );
}
