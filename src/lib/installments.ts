// Instalments of a loan or of a card purchase: which one is next, how many are
// left, and roughly how much is still owed. Pure, so it is tested.
//
// What is stored is the month of the first instalment; the count follows the
// calendar from there (an instalment counts once its due date has come). The
// person enters "cuotas ya pagadas" and can correct it at any time.
import { monthlyRate } from "./advice.ts";
import { daysInMonth, shiftMonth } from "./finance.ts";

export type RateType = "fixed" | "variable";

export const RATE_TYPE_LABEL: Record<RateType, string> = { fixed: "Tasa fija", variable: "Tasa variable" };

/** A purchase paid in instalments on a credit card. */
export interface CardPurchase {
  id: string;
  account_id: string;
  description: string;
  amount: number;
  installments: number;
  /** 'YYYY-MM' of the first instalment. */
  first_due_month: string;
  /** What the bank bills each month, when the person knows it. */
  monthly_payment: number | null;
  annual_rate: number | null;
  rate_type: RateType | null;
  refinanced: boolean;
}

const monthsBetween = (from: string, to: string) =>
  (Number(to.slice(0, 4)) - Number(from.slice(0, 4))) * 12 + Number(to.slice(5, 7)) - Number(from.slice(5, 7));

/**
 * The latest month whose instalment date has come (today counts). Without a
 * payment day, a month counts once it has ended.
 */
export function lastDueMonth(dueDay: number | null, today: string): string {
  const month = today.slice(0, 7);
  if (!dueDay) return shiftMonth(month, -1);
  const due = Math.min(dueDay, daysInMonth(Number(today.slice(0, 4)), Number(today.slice(5, 7))));
  return Number(today.slice(8, 10)) >= due ? month : shiftMonth(month, -1);
}

/** Instalments whose date has come, between 0 and the total. */
export function installmentsPaid(firstMonth: string, total: number, dueDay: number | null, today: string): number {
  return Math.min(total, Math.max(0, monthsBetween(firstMonth, lastDueMonth(dueDay, today)) + 1));
}

/** The first instalment's month for someone who says they have paid `paid` so far. */
export function firstMonthFor(paid: number, dueDay: number | null, today: string): string {
  return shiftMonth(lastDueMonth(dueDay, today), 1 - Math.max(0, paid));
}

/** Fixed instalment of a French-style schedule (the usual in Colombia); without a rate, equal parts. */
export function installmentPayment(principal: number, count: number, annualPct: number | null): number {
  const r = annualPct ? monthlyRate(annualPct) : 0;
  if (r === 0) return Math.round(principal / count);
  return Math.round((principal * r) / (1 - (1 + r) ** -count));
}

/** Principal still owed after `paid` instalments of that schedule. */
export function remainingPrincipal(principal: number, count: number, annualPct: number | null, paid: number): number {
  if (paid >= count) return 0;
  const r = annualPct ? monthlyRate(annualPct) : 0;
  if (r === 0) return Math.round((principal * (count - paid)) / count);
  const payment = (principal * r) / (1 - (1 + r) ** -count);
  const grown = (1 + r) ** paid;
  return Math.max(0, Math.round(principal * grown - (payment * (grown - 1)) / r));
}

export interface ScheduleView {
  paid: number;
  total: number;
  left: number;
  /** 'YYYY-MM' of the last instalment. */
  endsMonth: string;
  /** 'YYYY-MM' of the next instalment, or null when all are paid. */
  nextMonth: string | null;
  done: boolean;
}

export function scheduleView(firstMonth: string, total: number, dueDay: number | null, today: string): ScheduleView {
  const paid = installmentsPaid(firstMonth, total, dueDay, today);
  const left = total - paid;
  return {
    paid,
    total,
    left,
    endsMonth: shiftMonth(firstMonth, total - 1),
    nextMonth: left > 0 ? shiftMonth(firstMonth, paid) : null,
    done: left === 0,
  };
}

export interface PurchaseView extends ScheduleView {
  purchase: CardPurchase;
  /** The bank's instalment if registered, else computed from amount, count and rate. */
  payment: number;
  paymentIsEstimate: boolean;
  /** Principal still owed on this purchase, approx. */
  remaining: number;
}

export function purchaseView(purchase: CardPurchase, dueDay: number | null, today: string): PurchaseView {
  const schedule = scheduleView(purchase.first_due_month, purchase.installments, dueDay, today);
  return {
    ...schedule,
    purchase,
    payment: purchase.monthly_payment ?? installmentPayment(purchase.amount, purchase.installments, purchase.annual_rate),
    paymentIsEstimate: purchase.monthly_payment === null,
    remaining: remainingPrincipal(purchase.amount, purchase.installments, purchase.annual_rate, schedule.paid),
  };
}

/** What the card's purchases in instalments add up to this month and in total. */
export function purchasesSummary(views: PurchaseView[]) {
  const active = views.filter((v) => !v.done);
  return {
    active: active.length,
    monthly: active.reduce((sum, v) => sum + v.payment, 0),
    remaining: active.reduce((sum, v) => sum + v.remaining, 0),
  };
}
