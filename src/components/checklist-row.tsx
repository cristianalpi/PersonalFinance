"use client";

import { useActionState, useState } from "react";
import { markPaid, unmarkPaid, type FormState } from "@/app/actions";
import { formatCOP, formatDate, relativeDay, daysBetween, type ChecklistItem } from "@/lib/finance";

interface Props {
  item: ChecklistItem;
  month: string;
  today: string;
  /** Past months are a record: they can be read but not ticked. */
  editable: boolean;
  /** Accounts the payment can come from: cards and savings for a bill, savings for a debt. */
  accounts: { id: string; name: string }[];
}

export function ChecklistRow({ item, month, today, editable, accounts }: Props) {
  const [state, action, pending] = useActionState<FormState, FormData>(markPaid, {});
  const [open, setOpen] = useState(false);
  const days = item.due ? daysBetween(today, item.due) : null;

  const status = item.paid
    ? `Pagado${item.paidAmount ? `: ${formatCOP(item.paidAmount)}` : ""}`
    : item.due === null
      ? "Sin día de pago"
      : !editable
        ? `No se registró pago (vencía el ${formatDate(item.due)})`
        : `${formatDate(item.due)}, ${relativeDay(days!)}`;

  const box = `flex size-11 shrink-0 items-center justify-center rounded-full border-2 text-lg transition-colors ${
    item.paid ? "border-savings bg-savings text-surface" : item.overdue ? "border-ink text-ink" : "border-line text-transparent hover:border-ink-3"
  }`;

  return (
    <li className="py-3">
      <div className="flex items-center gap-3">
        {!editable ? (
          <span className={box} role="img" aria-label={item.paid ? "Pagado" : "Sin pagar"}>
            {item.paid ? "✓" : item.overdue ? "!" : ""}
          </span>
        ) : item.paid ? (
          <form action={unmarkPaid}>
            <input type="hidden" name="type" value={item.type} />
            <input type="hidden" name="id" value={item.id} />
            <input type="hidden" name="month" value={month} />
            <button className={box} aria-label={`Desmarcar ${item.name}: borra el pago registrado este mes`} title="Desmarcar (borra el pago registrado)">
              ✓
            </button>
          </form>
        ) : item.quick ? (
          <form action={action}>
            <input type="hidden" name="type" value={item.type} />
            <input type="hidden" name="id" value={item.id} />
            <input type="hidden" name="amount" value={item.quick.amount} />
            <input type="hidden" name="account_id" value={item.quick.accountId ?? ""} />
            <input type="hidden" name="occurred_on" value={today} />
            <button className={box} disabled={pending} aria-label={`Marcar ${item.name} como pagado por ${formatCOP(item.quick.amount)}`}>
              {item.overdue ? "!" : ""}
            </button>
          </form>
        ) : (
          <button type="button" className={box} aria-expanded={open} aria-label={`Marcar ${item.name} como pagado`} onClick={() => setOpen(!open)}>
            {item.overdue ? "!" : ""}
          </button>
        )}

        <div className="min-w-0 flex-1">
          <p className={`truncate font-medium ${item.paid ? "text-ink-2 line-through decoration-ink-3" : ""}`}>{item.name}</p>
          <p className={`text-sm ${item.overdue ? "font-medium text-ink" : "text-ink-3"}`}>{status}</p>
        </div>

        <div className="shrink-0 text-right">
          <p className="num">{item.paid ? formatCOP(item.paidAmount) : item.expected ? formatCOP(item.expected) : "Variable"}</p>
          {editable && !item.paid && item.quick && (
            <button type="button" className="text-xs text-ink-3 underline underline-offset-2 hover:text-ink" onClick={() => setOpen(!open)}>
              Otro valor
            </button>
          )}
        </div>
      </div>

      {editable && !item.paid && open && (
        <form action={action} className="rise mt-3 grid gap-3 sm:ml-14 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
          <input type="hidden" name="type" value={item.type} />
          <input type="hidden" name="id" value={item.id} />
          <label className="field">
            Cuánto pagaste
            <input className="input num" name="amount" inputMode="numeric" defaultValue={item.expected ?? ""} required autoFocus />
          </label>
          <label className="field">
            {item.type === "bill" ? "Con qué" : "Sale de"}
            <select className="input" name="account_id" defaultValue={item.quick?.accountId ?? ""} required={item.type === "bill"}>
              {item.type === "debt" && <option value="">Otra fuente (no registrada)</option>}
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Fecha
            <input className="input" type="date" name="occurred_on" defaultValue={today} min={`${month}-01`} max={today} required />
          </label>
          <button className="btn" disabled={pending}>
            Marcar pagado
          </button>
        </form>
      )}
      {state.error && <p role="alert" className="alert mt-2 sm:ml-14">{state.error}</p>}
    </li>
  );
}
