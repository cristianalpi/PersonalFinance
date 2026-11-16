"use client";

import { useMemo, useState } from "react";
import { deleteTx } from "@/app/actions";
import { formatCOP, formatDate, relativeDay, daysBetween, type Tx, type TxKind } from "@/lib/finance";

const FILTERS: { value: TxKind | "all"; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "expense", label: "Gastos" },
  { value: "payment", label: "Pagos" },
  { value: "income", label: "Ingresos" },
];

// The badge's shape and arrow carry the kind; the tint only reinforces it.
const LOOK: Record<TxKind, { glyph: string; badge: string; sign: string }> = {
  expense: { glyph: "↗", badge: "bg-debt/15 text-debt", sign: "−" },
  payment: { glyph: "⇄", badge: "bg-ink/10 text-ink", sign: "−" },
  income: { glyph: "↙", badge: "bg-savings/15 text-savings", sign: "+" },
};

const PAGE = 60;

export function TxList({ txs, accountNames, today }: { txs: Tx[]; accountNames: Record<string, string>; today: string }) {
  const [filter, setFilter] = useState<TxKind | "all">("all");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(PAGE);

  const title = (tx: Tx) =>
    tx.kind === "payment" ? `Pago a ${accountNames[tx.account_id] ?? "cuenta"}` : (tx.description ?? (tx.kind === "income" ? "Ingreso" : (tx.category ?? "Gasto")));
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
          {FILTERS.map((f) => (
            <button key={f.value} type="button" className="chip shrink-0" aria-pressed={filter === f.value} onClick={() => { setFilter(f.value); setLimit(PAGE); }}>
              {f.label}
            </button>
          ))}
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
            <div key={day.date} className="card rise p-0" style={{ "--i": position } as React.CSSProperties}>
              <div className="flex items-baseline justify-between gap-3 border-b border-line px-4 py-2.5 sm:px-5">
                <h3 className="text-sm font-medium" title={relativeDay(daysBetween(today, day.date))}>{dayLabel(day.date)}</h3>
                <p className="num text-xs text-ink-3">
                  {day.inn > 0 && <>+{formatCOP(day.inn)}</>}
                  {day.inn > 0 && day.out > 0 && " · "}
                  {day.out > 0 && <>−{formatCOP(day.out)}</>}
                </p>
              </div>
              <ul>
                {day.items.map((tx) => {
                  const look = LOOK[tx.kind];
                  return (
                    <li
                      key={tx.id}
                      className="rise group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-bg sm:px-5"
                      style={{ "--i": position++ } as React.CSSProperties}
                    >
                      <span className={`badge ${look.badge}`} aria-hidden="true">{look.glyph}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{title(tx)}</p>
                        <p className="truncate text-sm text-ink-3">{detail(tx)}</p>
                      </div>
                      <p className="num shrink-0 font-medium">
                        {look.sign}
                        {formatCOP(tx.amount)}
                      </p>
                      <form action={deleteTx} className="shrink-0">
                        <input type="hidden" name="id" value={tx.id} />
                        <button
                          className="rounded-md px-1.5 py-1 text-sm text-ink-3 transition-opacity hover:text-ink sm:opacity-0 sm:focus:opacity-100 sm:group-hover:opacity-100"
                          aria-label={`Eliminar ${title(tx)} del ${formatDate(tx.occurred_on)}`}
                        >
                          ✕
                        </button>
                      </form>
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
