// What the Debts tab shows for each card and loan. Pure, so it is tested.
import { monthlyRate, monthsToPayOff } from "./advice.ts";
import { balanceAt, daysBetween, monthLabel, nextDueDate, shiftMonth, type Account, type Tx } from "./finance.ts";

export interface DebtView {
  account: Account;
  balance: number;
  /** Cards: share of the limit in use (may pass 1 when over the limit). */
  usage: number | null;
  available: number | null;
  /** Loans: share already paid off, measured from `base`. */
  paidShare: number | null;
  /** What the loan's progress is measured from: the amount borrowed, or the balance when registered. */
  base: number | null;
  baseIsOriginal: boolean;
  monthsLeft: number | null;
  endsIn: string | null;
  /** Interest the balance generates in a month at the account's rate, rounded. */
  monthlyInterest: number | null;
  nextDue: string | null;
  daysToDue: number | null;
}

export type UsageLevel = "low" | "mid" | "high";

/** Card usage bands: under 30% is healthy, 30–70% is worth watching, from 70% it weighs. */
export function usageLevel(usage: number): UsageLevel {
  return usage < 0.3 ? "low" : usage < 0.7 ? "mid" : "high";
}

export function debtView(account: Account, txs: Tx[], today: string): DebtView {
  const balance = balanceAt(account, txs);
  const owed = Math.max(0, balance);
  const limit = account.kind === "credit_card" ? account.credit_limit : null;
  const isLoan = account.kind === "loan";
  const base = isLoan ? Math.max(account.original_amount ?? account.opening_balance, owed) : null;
  const months =
    isLoan && account.monthly_payment && account.annual_rate !== null ? monthsToPayOff(owed, account.monthly_payment, account.annual_rate) : null;
  const nextDue = account.due_day && owed > 0 ? nextDueDate(account.due_day, today) : null;

  return {
    account,
    balance,
    usage: limit ? owed / limit : null,
    available: limit ? Math.max(0, limit - owed) : null,
    paidShare: base ? (base - owed) / base : null,
    base,
    baseIsOriginal: isLoan && account.original_amount != null,
    monthsLeft: months,
    endsIn: months ? monthLabel(shiftMonth(today.slice(0, 7), months)) : null,
    monthlyInterest: account.annual_rate !== null && owed > 0 ? Math.round(owed * monthlyRate(account.annual_rate)) : null,
    nextDue,
    daysToDue: nextDue ? daysBetween(today, nextDue) : null,
  };
}

/** The debt where an extra peso saves the most interest: the highest rate among those still owed. */
export function payFirst(views: DebtView[]): string | null {
  const rated = views.filter((v) => v.balance > 0 && v.account.annual_rate !== null);
  if (rated.length < 2) return null;
  return rated.reduce((top, v) => (v.account.annual_rate! > top.account.annual_rate! ? v : top)).account.id;
}
