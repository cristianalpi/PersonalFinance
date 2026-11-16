import Link from "next/link";
import { monthsToPayOff } from "@/lib/advice";
import { formatCOP, formatDate, type Account } from "@/lib/finance";

/**
 * One debt as a bar that empties: the full track is the debt when it was
 * registered (or its peak, if it grew), the ochre part is what is still owed.
 */
export function DebtDescent({ account, balance }: { account: Account; balance: number }) {
  const start = Math.max(account.opening_balance, balance, 1);
  const remaining = Math.max(0, balance) / start;
  const paid = account.opening_balance - balance;
  const months =
    account.kind === "loan" && account.monthly_payment && account.annual_rate !== null && balance > 0
      ? monthsToPayOff(balance, account.monthly_payment, account.annual_rate)
      : null;
  const usage = account.credit_limit ? Math.round((Math.max(0, balance) / account.credit_limit) * 100) : null;

  return (
    <li>
      <Link href={`/cuentas/${account.id}`} className="group block py-4">
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-medium group-hover:underline group-hover:underline-offset-4">{account.name}</p>
          <p className="display text-xl">{formatCOP(balance)}</p>
        </div>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-line" role="img" aria-label={`Queda por pagar el ${Math.round(remaining * 100)}% de ${formatCOP(start)}`}>
          <div className="h-full rounded-full bg-debt transition-[width] duration-700" style={{ width: `${remaining * 100}%` }} />
        </div>
        <p className="mt-2 text-sm text-ink-2">
          {balance <= 0
            ? "Pagada por completo."
            : paid > 0
              ? `Has bajado ${formatCOP(paid)} (${Math.round((paid / account.opening_balance) * 100)}%) desde el ${formatDate(account.opening_date)}.`
              : paid < 0
                ? `Ha subido ${formatCOP(-paid)} desde el ${formatDate(account.opening_date)}.`
                : "Sin cambios desde que la registraste."}
          {months ? ` Te faltan ${months} ${months === 1 ? "cuota" : "cuotas"}.` : ""}
          {usage !== null ? ` Usas el ${usage}% del cupo.` : ""}
        </p>
      </Link>
    </li>
  );
}
