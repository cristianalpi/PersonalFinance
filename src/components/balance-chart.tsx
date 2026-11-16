"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCOP, formatCompact } from "@/lib/finance";

export interface BalancePoint {
  label: string;
  savings: number;
  debt: number;
}

const SERIES = [
  { key: "savings", name: "Ahorros", color: "var(--savings)" },
  { key: "debt", name: "Deuda", color: "var(--debt)" },
] as const;

export function BalanceChart({ data }: { data: BalancePoint[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="var(--line)" vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: "var(--line)" }} tick={{ fill: "var(--ink-3)", fontSize: 12 }} />
          <YAxis
            width={64}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--ink-3)", fontSize: 12 }}
            tickFormatter={(v: number) => formatCompact(v)}
          />
          <Tooltip
            formatter={(value) => formatCOP(Number(value))}
            cursor={{ stroke: "var(--ink-3)", strokeWidth: 1 }}
            contentStyle={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8, fontSize: 13 }}
            labelStyle={{ color: "var(--ink-2)" }}
            itemStyle={{ color: "var(--ink)" }}
          />
          <Legend
            verticalAlign="top"
            align="left"
            iconType="plainline"
            height={32}
            formatter={(name) => <span style={{ color: "var(--ink-2)", fontSize: 13 }}>{name}</span>}
          />
          {SERIES.map((s) => (
            <Line
              key={s.key}
              type="linear"
              dataKey={s.key}
              name={s.name}
              stroke={s.color}
              strokeWidth={2}
              dot={data.length < 3 ? { r: 4 } : false}
              activeDot={{ r: 5, stroke: "var(--surface)", strokeWidth: 2 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
