"use client";

import { useEffect, useMemo, useState } from "react";
import { deleteTx } from "@/app/actions";
import { ADJUSTMENT, formatCOP, formatDate, relativeDay, daysBetween, txIcon, type Tx, type TxKind } from "@/lib/finance";

const FILTERS: { value: TxKind | "all"; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "expense", label: "Gastos" },
  { value: "payment", label: "Pagos" },
  { value: "income", label: "Ingresos" },
];

// Each kind has its own stripe, tint and word, so it reads without relying on colour alone.
const LOOK: Record<TxKind, { label: string; stripe: string; tint: string; sign: string }> = {
  expense: { label: "Gasto", stripe: "var(--debt)", tint: "bg-debt/15", sign: "−" },
  payment: { label: "Pago a deuda", stripe: "var(--brand)", tint: "bg-brand/15", sign: "−" },
  income: { label: "Ingreso", stripe: "var(--savings)", tint: "bg-savings/15", sign: "+" },
};

const PAGE = 60;

export function TxList({ txs, accountNames, today }: { txs: Tx[]; accountNames: Record<string, string>; today: string }) {
  const [filter, setFilter] = useState<TxKind | "all">("all");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(PAGE);
  // Deleting asks for a second tap on the same row, which expires after a few seconds.
  const [armed, setArmed] = useState<string | null>(null);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(null), 4000);
    return () => clearTimeout(t);
  }, [armed]);

  const title = (tx: Tx) =>
    tx.category === ADJUSTMENT
      ? `Ajuste de saldo · ${accountNames[tx.account_id] ?? "cuenta"}`
      : tx.kind === "payment" ? `Pago a ${accountNames[tx.account_id] ?? "cuenta"}` : (tx.description ?? (tx.kind === "income" ? "Ingreso" : (tx.category ?? "Gasto")));
  const detail = (tx: Tx) =>
    [
      tx.kind === "expense" && tx.description ? tx.category : null,
      tx.kind === "payment" ? (tx.source_account_id ? `desde ${accountNames[tx.source_account_id]}` : null) : accountNames[tx.account_id],
      tx.kind === "payment" ? tx.description : null,
      tx.source === "wallet" ? "Apple Wallet" : null,
    ]
      .filter(Boolean)
      .join(" · ");

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return txs.filter(
      (tx) =>
        (filter === "all" || tx.kind === filter) &&
        (!q || [tx.description, tx.category, accountNames[tx.account_id]].some((field) => field?.toLowerCase().includes(q))),
    );
  }, [txs, filter, query, accountNames]);

  const days = useMemo(() => {
    const groups: { date: string; items: Tx[]; out: number; inn: number }[] = [];
    for (const tx of matches.slice(0, limit)) {
      let group = groups[groups.length - 1];
      if (!group || group.date !== tx.occurred_on) groups.push((group = { date: tx.occurred_on, items: [], out: 0, inn: 0 }));
      group.items.push(tx);
      if (tx.kind === "income") group.inn += tx.amount;
      else if (tx.kind === "expense") group.out += tx.amount;
    }
    return groups;
  }, [matches, limit]);

  const dayLabel = (date: string) => {
    const diff = daysBetween(today, date);
    return diff === 0 ? "Hoy" : diff === -1 ? "Ayer" : formatDate(date);
  };

  let position = 0;
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="group" aria-label="Filtrar por tipo">
          {FILTERS.map((f) => {
            const count = f.value === "all" ? txs.length : txs.filter((t) => t.kind === f.value).length;
            return (
              <button key={f.value} type="button" className="chip shrink-0" aria-pressed={filter === f.value} onClick={() => { setFilter(f.value); setLimit(PAGE); }}>
                {f.label} <span className="num opacity-70">{count}</span>
              </button>
            );
          })}
        </div>
        <input
          className="input sm:max-w-60"
          type="search"
          placeholder="Buscar comercio o categoría"
          aria-label="Buscar movimientos"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setLimit(PAGE); }}
        />
      </div>

      {days.length === 0 ? (
        <p className="card text-sm text-ink-3">{txs.length === 0 ? "Aún no hay movimientos." : "Nada coincide con ese filtro."}</p>
      ) : (
        // Re-keying on the filter replays the entrance animation for the new set.
        <div key={`${filter}|${query}`} className="flex flex-col gap-4">
          {days.map((day) => (
            <div key={day.date} className="card rise overflow-hidden p-0 sm:p-0" style={{ "--i": position } as React.CSSProperties}>
              <div className="flex items-baseline justify-between gap-3 border-b border-line px-4 py-2.5 sm:px-5">
                <h3 className="text-sm font-medium" title={relativeDay(daysBetween(today, day.date))}>{dayLabel(day.date)}</h3>
                <p className="flex gap-1.5">
                  {day.inn > 0 && <span className="pill num bg-savings/15">+{formatCOP(day.inn)}</span>}
                  {day.out > 0 && <span className="pill num bg-debt/15">−{formatCOP(day.out)}</span>}
                </p>
              </div>
              <ul>
                {day.items.map((tx) => {
                  const look = LOOK[tx.kind];
                  return (
                    <li
                      key={tx.id}
                      className="rise group relative flex items-center gap-3 py-3 pl-5 pr-2 transition-colors hover:bg-brand/5 sm:pr-5"
                      style={{ "--i": position++ } as React.CSSProperties}
                    >
                      <span aria-hidden="true" className="absolute inset-y-2 left-0 w-1 rounded-r-full" style={{ background: look.stripe }} />
                      <span className={`badge text-xl ${look.tint}`} aria-hidden="true">
                        {txIcon(tx)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{title(tx)}</p>
                        <p className="truncate text-sm text-ink-3">
                          {/* Phones have little room: the stripe, icon and sign already tell the kind there. */}
                          <span className="font-medium text-ink-2 max-sm:sr-only">{look.label}</span>
                          <span className="max-sm:hidden">{detail(tx) ? " · " : ""}</span>
                          {detail(tx)}
                        </p>
                      </div>
                      <p className={`display num shrink-0 rounded-xl px-2 py-0.5 text-lg ${tx.kind === "income" ? "bg-savings/15" : ""}`}>
                        {look.sign}
                        {formatCOP(tx.amount)}
                      </p>
                      {armed === tx.id ? (
                        <form action={deleteTx} className="rise shrink-0">
                          <input type="hidden" name="id" value={tx.id} />
                          <button className="pill pill-urgent py-1.5 text-xs" aria-label={`Confirmar: borrar ${title(tx)}`}>
                            Borrar
                          </button>
                        </form>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setArmed(tx.id)}
                          className="shrink-0 rounded-md px-1.5 py-1 text-sm text-ink-3 transition-opacity hover:text-ink sm:opacity-0 sm:focus:opacity-100 sm:group-hover:opacity-100"
                          aria-label={`Eliminar ${title(tx)} del ${formatDate(tx.occurred_on)}`}
                        >
                          ✕
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}

      {matches.length > limit && (
        <button type="button" className="btn-quiet self-center" onClick={() => setLimit(limit + PAGE)}>
          Ver más ({matches.length - limit} restantes)
        </button>
      )}
    </section>
  );
}
