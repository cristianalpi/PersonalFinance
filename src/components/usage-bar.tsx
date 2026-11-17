import { usageLevel } from "@/lib/debts";

const LEVEL = {
  low: { fill: "fill-have", label: "Uso sano" },
  mid: { fill: "fill-warn", label: "Uso medio" },
  high: { fill: "fill-owe", label: "Uso alto" },
};

/** Share of a card's limit in use. The band is named in words too, so colour is never the only cue. */
export function UsageBar({ usage, onCard = false }: { usage: number; onCard?: boolean }) {
  const level = LEVEL[usageLevel(usage)];
  const pct = Math.round(usage * 100);
  return (
    <div className="mt-3">
      <div className="flex items-baseline justify-between text-xs font-semibold">
        <span>{level.label}</span>
        <span className="num">{pct}% del cupo</span>
      </div>
      <div
        className={`mt-1.5 h-2.5 overflow-hidden rounded-full ${onCard ? "bg-black/20" : "track"}`}
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label={`Uso del cupo: ${pct}%`}
      >
        <div className={`fill ${onCard ? "bg-white" : level.fill}`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
    </div>
  );
}
