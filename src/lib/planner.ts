// Debt payoff plans: month by month, interest first, then each debt's minimum,
// then whatever is left to one debt at a time. Pure, so it is tested.
import { monthlyRate } from "./advice.ts";
import { balanceAt, isDebt, type Account, type Tx } from "./finance.ts";

export type Strategy = "minimum" | "avalanche" | "snowball";

export interface PlanDebt {
  id: string;
  name: string;
  balance: number;
  annualRate: number | null;
  minPayment: number;
  /** True when the minimum was assumed because none was registered. */
  assumedMin: boolean;
}

export interface PlanResult {
  strategy: Strategy;
  /** Months until every debt is at zero; null when the payments never catch up (or past 50 years). */
  months: number | null;
  totalInterest: number;
  /** Month (1 = next month) each debt reaches zero; null if it never does within the horizon. */
  payoffMonth: Record<string, number | null>;
  /** Payoff order, first cleared first. */
  order: string[];
}

const HORIZON = 600;

/** A card's assumed minimum when none is registered: 5% of the balance, at least $50.000. */
export function assumedMinimum(balance: number): number {
  return Math.max(50_000, Math.round(balance * 0.05));
}

export function planDebts(accounts: Account[], txs: Tx[]): PlanDebt[] {
  return accounts
    .filter(isDebt)
    .map((a) => {
      const balance = Math.max(0, balanceAt(a, txs));
      const registered = a.monthly_payment ?? null;
      return {
        id: a.id,
        name: a.name,
        balance,
        annualRate: a.annual_rate,
        minPayment: Math.min(balance, registered ?? assumedMinimum(balance)),
        assumedMin: registered === null,
      };
    })
    .filter((d) => d.balance > 0);
}

export function simulate(debts: PlanDebt[], extra: number, strategy: Strategy): PlanResult {
  const balance = new Map(debts.map((d) => [d.id, d.balance]));
  const payoffMonth: Record<string, number | null> = Object.fromEntries(debts.map((d) => [d.id, null]));
  const order: string[] = [];
  // With the minimum strategy a cleared debt's payment is simply no longer spent.
  // With avalanche and snowball it rolls over to the next debt, plus the extra.
  const budget = debts.reduce((sum, d) => sum + d.minPayment, 0) + (strategy === "minimum" ? 0 : extra);
  let totalInterest = 0;

  const rank = (a: PlanDebt, b: PlanDebt) =>
    strategy === "snowball"
      ? balance.get(a.id)! - balance.get(b.id)!
      : (b.annualRate ?? 0) - (a.annualRate ?? 0) || balance.get(a.id)! - balance.get(b.id)!;

  for (let month = 1; month <= HORIZON; month++) {
    const active = debts.filter((d) => balance.get(d.id)! > 0.5);
    if (active.length === 0) break;

    for (const d of active) {
      const interest = balance.get(d.id)! * (d.annualRate ? monthlyRate(d.annualRate) : 0);
      totalInterest += interest;
      balance.set(d.id, balance.get(d.id)! + interest);
    }

    let left = strategy === "minimum" ? Infinity : budget;
    for (const d of active) {
      const pay = Math.min(d.minPayment, balance.get(d.id)!, left);
      balance.set(d.id, balance.get(d.id)! - pay);
      left -= pay;
    }
    if (strategy !== "minimum") {
      for (const d of [...active].sort(rank)) {
        if (left <= 0) break;
        const pay = Math.min(left, balance.get(d.id)!);
        balance.set(d.id, balance.get(d.id)! - pay);
        left -= pay;
      }
    }

    for (const d of active) {
      if (balance.get(d.id)! <= 0.5 && payoffMonth[d.id] === null) {
        payoffMonth[d.id] = month;
        order.push(d.id);
      }
    }
  }

  const unpaid = debts.some((d) => payoffMonth[d.id] === null);
  const last = Math.max(0, ...Object.values(payoffMonth).map((m) => m ?? 0));
  return { strategy, months: unpaid ? null : last, totalInterest: Math.round(totalInterest), payoffMonth, order };
}
