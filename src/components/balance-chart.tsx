"use client";

import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCOP, formatCompact } from "@/lib/finance";

export interface ChartSeries {
  key: string;
  name: string;
  color: string;
}

export const HAVE_OWE: ChartSeries[] = [
  { key: "savings", name: "Tienes", color: "var(--savings)" },
  { key: "debt", name: "Debes", color: "var(--debt)" },
];

/**
 * Month-end balances as soft filled curves on one peso axis. The fill fades
 * to nothing so two overlapping series stay readable; the line carries the value.
 * A single series needs no legend: the title names it.
 */
export function BalanceChart({ data, series }: { data: Record<string, string | number | null>[]; series: ChartSeries[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <defs>
            {series.map((s) => (
              <linearGradient key={s.key} id={`area-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={0.35} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid stroke="color-mix(in srgb, var(--ink) 10%, transparent)" strokeDasharray="3 6" vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "var(--ink-3)", fontSize: 12 }} />
          <YAxis width={64} tickLine={false} axisLine={false} tick={{ fill: "var(--ink-3)", fontSize: 12 }} tickFormatter={(v: number) => formatCompact(v)} />
          <Tooltip
            formatter={(value) => formatCOP(Number(value))}
            cursor={{ stroke: "var(--brand)", strokeWidth: 1.5, strokeDasharray: "4 4" }}
            contentStyle={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, fontSize: 13, boxShadow: "var(--shadow)" }}
            labelStyle={{ color: "var(--ink-2)", fontWeight: 600 }}
            itemStyle={{ color: "var(--ink)" }}
          />
          {series.length > 1 && (
            <Legend
              verticalAlign="top"
              align="left"
              iconType="circle"
              height={32}
              itemSorter={null}
              formatter={(name) => <span style={{ color: "var(--ink-2)", fontSize: 13, fontWeight: 500 }}>{name}</span>}
            />
          )}
          {series.map((s) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color}
              strokeWidth={3}
              strokeLinecap="round"
              fill={`url(#area-${s.key})`}
              dot={data.length < 3 ? { r: 4, fill: s.color } : false}
              activeDot={{ r: 6, stroke: "var(--surface)", strokeWidth: 3 }}
              animationDuration={1100}
              connectNulls={false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
