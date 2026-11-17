// Goals: save an amount by a date, or clear a debt by a date. Pure, so it is tested.
import { monthlyRate } from "./advice.ts";
import { balanceAt, daysBetween, type Account, type Tx } from "./finance.ts";

export type GoalKind = "save" | "payoff";

export interface Goal {
  id: string;
  kind: GoalKind;
  name: string;
  emoji: string | null;
  target_amount: number | null;
  target_date: string;
  account_id: string | null;
  start_balance: number | null;
  created_on: string;
}

export interface GoalDeposit {
  id: string;
  goal_id: string;
  amount: number;
  occurred_on: string;
}

export type GoalStatus = "done" | "ahead" | "on_track" | "behind" | "overdue";

export interface GoalView {
  goal: Goal;
  /** The debt, for payoff goals. */
  account: Account | null;
  target: number;
  achieved: number;
  remaining: number;
  progress: number;
  daysLeft: number;
  /** What to set aside to arrive on time, rounded up to the next $1.000. */
  perMonth: number;
  perQuincena: number;
  perWeek: number;
  /** Where a steady pace from the start date would have you today. */
  expected: number;
  status: GoalStatus;
}

const roundUp = (n: number) => (n <= 0 ? 0 : Math.ceil(n / 1000) * 1000);

/** The fixed monthly payment that clears `balance` in `months` at `annualPct` (plain division at 0%). */
export function paymentToClear(balance: number, months: number, annualPct: number | null): number {
  if (balance <= 0) return 0;
  const n = Math.max(1, months);
  const r = annualPct ? monthlyRate(annualPct) : 0;
  return r === 0 ? balance / n : (r * balance) / (1 - Math.pow(1 + r, -n));
}

export function goalView(goal: Goal, deposits: GoalDeposit[], accounts: Account[], txs: Tx[], today: string): GoalView {
  const daysLeft = daysBetween(today, goal.target_date);
  const days = Math.max(1, daysLeft);
  const months = Math.max(1, Math.ceil(days / 30.44));
  const quincenas = Math.max(1, Math.ceil(days / 15.22));
  const weeks = Math.max(1, Math.ceil(days / 7));

  let account: Account | null = null;
  let target: number;
  let achieved: number;
  let remaining: number;
  let perMonth: number;

  if (goal.kind === "payoff") {
    account = accounts.find((a) => a.id === goal.account_id) ?? null;
    const owed = account ? Math.max(0, balanceAt(account, txs)) : 0;
    target = Math.max(goal.start_balance ?? owed, owed, 1);
    remaining = owed;
    achieved = target - owed;
    perMonth = paymentToClear(owed, months, account?.annual_rate ?? null);
  } else {
    target = goal.target_amount ?? 0;
    achieved = deposits.filter((d) => d.goal_id === goal.id).reduce((sum, d) => sum + d.amount, 0);
    remaining = Math.max(0, target - achieved);
    perMonth = remaining / months;
  }

  const span = Math.max(1, daysBetween(goal.created_on, goal.target_date));
  const elapsed = Math.min(span, Math.max(0, daysBetween(goal.created_on, today)));
  const expected = (target * elapsed) / span;
  const slack = target * 0.03;

  const status: GoalStatus =
    remaining <= 0
      ? "done"
      : daysLeft < 0
        ? "overdue"
        : achieved < expected - slack
          ? "behind"
          : achieved > expected + target * 0.1
            ? "ahead"
            : "on_track";

  return {
    goal,
    account,
    target,
    achieved,
    remaining,
    progress: target > 0 ? Math.min(1, Math.max(0, achieved / target)) : 0,
    daysLeft,
    perMonth: roundUp(perMonth),
    perQuincena: goal.kind === "payoff" ? roundUp(perMonth / 2) : roundUp(remaining / quincenas),
    perWeek: goal.kind === "payoff" ? roundUp((perMonth * 12) / 52) : roundUp(remaining / weeks),
    expected,
    status,
  };
}
