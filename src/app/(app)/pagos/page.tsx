import Link from "next/link";
import { deleteBill } from "@/app/actions";
import { BillForm } from "@/components/bill-forms";
import { ChecklistRow } from "@/components/checklist-row";
import { loadData } from "@/lib/data";
import { formatCOP, monthName, monthlyChecklist, shiftMonth } from "@/lib/finance";

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const { accounts, txs, bills, today } = await loadData();
  const current = today.slice(0, 7);
  const asked = (await searchParams).mes;
  // Only the current month and the past: future months have nothing to tick yet.
  const month = asked && /^\d{4}-(0[1-9]|1[0-2])$/.test(asked) && asked <= current ? asked : current;
  const editable = month === current;

  const items = monthlyChecklist(accounts, bills, txs, month, today);
  const done = items.filter((i) => i.paid).length;
  const pendingAmount = items.filter((i) => !i.paid).reduce((sum, i) => sum + (i.expected ?? 0), 0);
  const variable = items.filter((i) => !i.paid && !i.expected).length;

  const spendable = accounts.filter((a) => a.kind !== "loan").map(({ id, name }) => ({ id, name }));
  const savings = accounts.filter((a) => a.kind === "savings").map(({ id, name }) => ({ id, name }));

  return (
    <>
      <div className="pt-2">
        <div className="flex items-center justify-between gap-3">
          <h1 className="display text-3xl">
            Pagos de {monthName(month)}
            {month.slice(0, 4) !== current.slice(0, 4) ? ` ${month.slice(0, 4)}` : ""}
          </h1>
          <nav className="flex gap-2" aria-label="Cambiar de mes">
            <Link href={`/pagos?mes=${shiftMonth(month, -1)}`} className="btn-quiet" aria-label={`Ver ${monthName(shiftMonth(month, -1))}`}>
              ‹
            </Link>
            {editable ? (
              <span className="btn-quiet opacity-40" aria-hidden="true">
                ›
              </span>
            ) : (
              <Link href={`/pagos?mes=${shiftMonth(month, 1)}`} className="btn-quiet" aria-label={`Ver ${monthName(shiftMonth(month, 1))}`}>
                ›
              </Link>
            )}
          </nav>
        </div>
        <p className="mt-1 text-sm text-ink-3">
          {editable
            ? "Tus pagos obligatorios del mes. Al marcar uno se registra el pago; el primer día de cada mes la lista vuelve a empezar."
            : "Mes cerrado: así quedó la lista."}
        </p>
      </div>

      {items.length === 0 ? (
        <section className="card">
          <p className="font-medium">No hay pagos obligatorios {editable ? "este mes" : "en ese mes"}.</p>
          <p className="mt-1 text-sm text-ink-2">Agrega tus pagos fijos aquí abajo. Las tarjetas y créditos con deuda aparecen solos.</p>
        </section>
      ) : (
        <section className="card" aria-label="Lista de pagos del mes">
          <div className="flex items-baseline justify-between gap-3">
            <p className="display text-2xl">
              {done} de {items.length} pagados
            </p>
            <p className="text-right text-sm text-ink-2">
              {done === items.length ? (
                "Mes al día."
              ) : (
                <>
                  Faltan <span className="num font-medium text-ink">{formatCOP(pendingAmount)}</span>
                  {variable > 0 ? ` y ${variable} de valor variable` : ""}
                </>
              )}
            </p>
          </div>
          <div className="track mt-3 h-3" role="img" aria-label={`${done} de ${items.length} pagados`}>
            <div className="fill fill-have" style={{ width: `${(done / items.length) * 100}%` }} />
          </div>
          <ul className="mt-3 divide-y divide-line">
            {items.map((item) => (
              <ChecklistRow
                key={`${item.type}-${item.id}`}
                item={item}
                month={month}
                today={today}
                editable={editable}
                accounts={item.type === "bill" ? spendable : savings}
              />
            ))}
          </ul>
        </section>
      )}

      {editable && (
        <>
          <details className="group" open={bills.length === 0}>
            <summary className="btn-quiet inline-flex cursor-pointer list-none">Agregar un pago fijo</summary>
            <div className="mt-3">
              <BillForm />
            </div>
          </details>

          {bills.length > 0 && (
            <section className="card">
              <h2 className="display text-2xl">Pagos fijos registrados</h2>
              <p className="text-sm text-ink-3">Recibos, arriendo, suscripciones. Las tarjetas y créditos se administran en Cuentas.</p>
              <ul className="mt-2 divide-y divide-line">
                {bills.map((bill) => (
                  <li key={bill.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <span>
                      <span className="font-medium">{bill.name}</span>, día {bill.due_day}, {bill.amount ? formatCOP(bill.amount) : "valor variable"}
                    </span>
                    <form action={deleteBill}>
                      <input type="hidden" name="id" value={bill.id} />
                      <button className="text-ink-3 hover:text-ink">Eliminar</button>
                    </form>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </>
  );
}
