"use client";

import Link from "next/link";
import { useState } from "react";
import type { CalendarEntry, EntryStatus } from "@/lib/calendar";
import { formatCOP } from "@/lib/finance";

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];
const WEEKDAY_FULL = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const TYPE_LABEL = { bill: "Pago fijo", debt: "Tarjeta o préstamo", income: "Ingreso", goal: "Ahorro para una meta" } as const;

/** Coral for what goes out, teal for what comes in, violet for what you set aside. */
const TYPE_COLOR = { bill: "var(--debt)", debt: "var(--debt)", income: "var(--savings)", goal: "var(--brand)" } as const;

const longDay = (date: string) => {
  const d = new Date(`${date}T12:00:00Z`);
  return `${WEEKDAY_FULL[d.getUTCDay()]} ${d.getUTCDate()} de ${MONTHS[d.getUTCMonth()]}`;
};

function statusLabel(entry: CalendarEntry): { text: string; tone: string } {
  const income = entry.type === "income";
  const map: Record<EntryStatus, { text: string; tone: string }> = {
    paid: { text: income ? "Recibido" : "Pagado", tone: "pill-idea" },
    pending: { text: income ? "Por llegar" : "Pendiente", tone: "bg-line/60" },
    overdue: { text: income ? "Atrasado" : "Vencido", tone: "pill-urgent" },
    skipped: { text: "No aplica este mes", tone: "pill-warn" },
  };
  return map[entry.status];
}

/** A dot per entry: coral for what goes out, teal for what comes in; hollow once settled. */
function Dot({ entry }: { entry: CalendarEntry }) {
  const color = TYPE_COLOR[entry.type];
  const settled = entry.status === "paid" || entry.status === "skipped";
  return (
    <span
      aria-hidden="true"
      className="size-1.5 rounded-full"
      style={settled ? { boxShadow: `inset 0 0 0 1.5px ${color}` } : { background: color }}
    />
  );
}

function EntryRow({ entry }: { entry: CalendarEntry }) {
  const status = statusLabel(entry);
  const body = (
    <>
      <span
        aria-hidden="true"
        className="mt-1.5 size-2.5 shrink-0 rounded-full"
        style={{ background: TYPE_COLOR[entry.type] }}
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{entry.name}</span>
        <span className="block text-xs text-ink-3">{TYPE_LABEL[entry.type]}</span>
      </span>
      <span className="shrink-0 text-right">
        <span className={`num block font-semibold ${entry.status === "paid" || entry.status === "skipped" ? "text-ink-3" : ""}`}>
          {entry.amount !== null ? `${entry.type === "income" ? "+" : ""}${formatCOP(entry.amount)}` : "Valor variable"}
        </span>
        <span className={`pill mt-0.5 ${status.tone}`}>{status.text}</span>
      </span>
    </>
  );
  return (
    <li>
      {entry.type === "debt" || entry.type === "goal" ? (
        <Link href={entry.type === "goal" ? `/metas/${entry.id}` : `/cuentas/${entry.id}`} className="-mx-2 flex items-start gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-line/40">
          {body}
        </Link>
      ) : (
        <div className="flex items-start gap-3 py-2.5">{body}</div>
      )}
    </li>
  );
}

/**
 * The month's payments and incomes on a calendar. Tapping a day lists what falls on it;
 * below, what is still coming this month, in order.
 */
export function PaymentsCalendar({
  weeks,
  byDate,
  undated,
  today,
  month,
}: {
  weeks: (string | null)[][];
  byDate: Record<string, CalendarEntry[]>;
  undated: CalendarEntry[];
  today: string;
  month: string;
}) {
  const days = Object.keys(byDate).sort();
  // Start on today in the current month, otherwise on the first day with something.
  const [selected, setSelected] = useState<string | null>(today.startsWith(month) ? today : (days[0] ?? null));
  const from = today.startsWith(month) ? today : `${month}-01`;
  const upcoming = days
    .filter((d) => d >= from)
    .flatMap((d) => byDate[d].filter((e) => e.status === "pending" || e.status === "overdue"));
  const overdue = days.filter((d) => d < from).flatMap((d) => byDate[d].filter((e) => e.status === "overdue"));
  const chosen = selected ? (byDate[selected] ?? []) : [];

  return (
    <>
      <section className="card flex flex-col gap-3" aria-label="Calendario de pagos">
        <div className="grid grid-cols-7 text-center text-xs font-semibold text-ink-3" aria-hidden="true">
          {WEEKDAYS.map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1" role="grid">
          {weeks.flat().map((date, i) => {
            if (!date) return <span key={i} />;
            const entries = byDate[date] ?? [];
            const isToday = date === today;
            const isSelected = date === selected;
            const late = entries.some((e) => e.status === "overdue");
            return (
              <button
                key={date}
                type="button"
                role="gridcell"
                aria-selected={isSelected}
                aria-label={`${longDay(date)}: ${entries.length ? `${entries.length} ${entries.length === 1 ? "movimiento" : "movimientos"}` : "nada"}`}
                onClick={() => setSelected(date)}
                className={`relative flex aspect-square flex-col items-center justify-center gap-1 rounded-xl text-sm transition-[background,transform] duration-150 active:scale-90 ${
                  isSelected ? "bg-brand text-white shadow-[0_8px_20px_-10px_var(--brand)]" : entries.length ? "bg-surface/70 font-semibold" : "text-ink-3"
                } ${isToday && !isSelected ? "ring-2 ring-brand ring-inset" : ""}`}
              >
                <span className="num leading-none">{Number(date.slice(8))}</span>
                {entries.length > 0 && (
                  <span className={`flex items-center gap-0.5 ${isSelected ? "[&>span]:!bg-white [&>span]:!shadow-none" : ""}`}>
                    {entries.slice(0, 3).map((e) => (
                      <Dot key={`${e.type}-${e.id}`} entry={e} />
                    ))}
                    {entries.length > 3 && <span className="text-[9px] leading-none">+</span>}
                  </span>
                )}
                {late && !isSelected && <span aria-hidden="true" className="absolute right-1 top-1 size-1.5 rounded-full bg-[var(--warn)]" />}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-3">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-[var(--debt)]" /> Pagos
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-[var(--savings)]" /> Ingresos
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-brand" /> Ahorro de metas
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full shadow-[inset_0_0_0_1.5px_var(--ink-3)]" /> Ya resuelto
          </span>
        </div>
      </section>

      {selected && (
        <section key={selected} className="card rise" aria-live="polite">
          <h2 className="display text-xl first-letter:uppercase">{longDay(selected)}</h2>
          {chosen.length ? (
            <ul className="mt-1 divide-y divide-line">
              {chosen.map((e) => (
                <EntryRow key={`${e.type}-${e.id}`} entry={e} />
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-sm text-ink-3">Nada programado este día.</p>
          )}
        </section>
      )}

      {(upcoming.length > 0 || overdue.length > 0) && (
        <section className="card" aria-labelledby="upcoming-title">
          <h2 id="upcoming-title" className="display text-xl">
            {today.startsWith(month) ? "Lo que viene este mes" : "Lo que tiene este mes"}
          </h2>
          {overdue.length > 0 && (
            <p className="mt-1 text-sm text-ink-2">
              Tienes {overdue.length} {overdue.length === 1 ? "pendiente atrasado" : "pendientes atrasados"} de días anteriores.
            </p>
          )}
          <ul className="mt-1 divide-y divide-line">
            {[...overdue, ...upcoming].map((e) => (
              <li key={`${e.type}-${e.id}`} className="flex items-center gap-3 py-2.5 text-sm">
                <button type="button" className="num w-12 shrink-0 rounded-lg bg-line/50 py-1 text-center text-xs font-semibold" onClick={() => setSelected(e.date)}>
                  {Number(e.date.slice(8))} {MONTHS[Number(e.date.slice(5, 7)) - 1].slice(0, 3)}
                </button>
                <span className="min-w-0 flex-1 truncate">{e.name}</span>
                <span className={`num shrink-0 font-semibold ${e.type === "income" ? "text-[var(--savings)]" : ""}`}>
                  {e.amount !== null ? `${e.type === "income" ? "+" : ""}${formatCOP(e.amount)}` : "Variable"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {undated.length > 0 && (
        <p className="text-sm text-ink-3">
          Sin día de pago registrado: {undated.map((e) => e.name).join(", ")}. Agrégalo al editar la cuenta para verla en el calendario.
        </p>
      )}
    </>
  );
}
