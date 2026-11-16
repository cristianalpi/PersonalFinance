import { deleteBill } from "@/app/actions";
import { BillForm, PayBill } from "@/components/bill-forms";
import { loadData } from "@/lib/data";
import { billStatus, formatCOP, formatDate, relativeDay } from "@/lib/finance";

export default async function BillsPage() {
  const { accounts, txs, bills, today } = await loadData();
  const payFrom = accounts.filter((a) => a.kind !== "loan").map(({ id, name }) => ({ id, name }));
  const rows = bills.map((bill) => ({ bill, status: billStatus(bill, txs, today) })).sort((a, b) => a.status.date.localeCompare(b.status.date));
  const monthly = bills.reduce((sum, b) => sum + (b.amount ?? 0), 0);

  return (
    <>
      <div>
        <h1 className="display pt-2 text-3xl">Recibos y gastos fijos</h1>
        <p className="text-sm text-ink-3">
          Lo que pagas cada mes en una fecha fija. Aparecen en Próximos pagos, en las recomendaciones y en tu calendario.
        </p>
      </div>
      <BillForm />
      {rows.length > 0 && (
        <section className="card">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="eyebrow">Este mes</h2>
            <p className="text-sm text-ink-2">
              Fijos al mes: <span className="num font-medium text-ink">{formatCOP(monthly)}</span>
              {bills.some((b) => !b.amount) ? " más los de valor variable" : ""}
            </p>
          </div>
          <ul className="mt-2 divide-y divide-line">
            {rows.map(({ bill, status }) => (
              <li key={bill.id} className="flex flex-col gap-3 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className={`badge ${status.paidThisMonth ? "bg-savings/15 text-savings" : status.days < 0 ? "bg-ink text-bg" : "bg-ink/10 text-ink"}`} aria-hidden="true">
                      {status.paidThisMonth ? "✓" : status.days < 0 ? "!" : bill.due_day}
                    </span>
                    <div>
                      <p className="font-medium">{bill.name}</p>
                      <p className="text-sm text-ink-3">
                        {status.paidThisMonth ? `Pagado este mes · próximo: ${formatDate(status.date)}` : `${formatDate(status.date)} · ${relativeDay(status.days)}`}
                      </p>
                    </div>
                  </div>
                  <p className="num shrink-0 font-medium">{bill.amount ? formatCOP(bill.amount) : "Variable"}</p>
                </div>
                <div className="flex flex-wrap items-start gap-3">
                  {!status.paidThisMonth && payFrom.length > 0 && <PayBill bill={bill} accounts={payFrom} today={today} />}
                  <form action={deleteBill}>
                    <input type="hidden" name="id" value={bill.id} />
                    <button className="py-1.5 text-sm text-ink-3 hover:text-ink">Eliminar</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
          {payFrom.length === 0 && <p className="mt-2 text-sm text-ink-3">Registra una cuenta de ahorros o una tarjeta para poder marcar pagos.</p>}
        </section>
      )}
    </>
  );
}
