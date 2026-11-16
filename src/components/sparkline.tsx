/** Tiny trend line for one account. Decorative: the balance beside it carries the value. */
export function Sparkline({ values, color }: { values: (number | null)[]; color: string }) {
  const points = values.flatMap((v, i) => (v === null ? [] : [{ i, v }]));
  if (points.length < 2) return null;
  const W = 120;
  const H = 32;
  const min = Math.min(...points.map((p) => p.v));
  const max = Math.max(...points.map((p) => p.v));
  const span = max - min || 1;
  const x = (i: number) => (i / (values.length - 1)) * (W - 4) + 2;
  const y = (v: number) => H - 3 - ((v - min) / span) * (H - 6);
  const path = points.map((p, n) => `${n ? "L" : "M"}${x(p.i).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ");
  const last = points[points.length - 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} aria-hidden="true" className="shrink-0">
      <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={x(last.i)} cy={y(last.v)} r="3" fill={color} />
    </svg>
  );
}
