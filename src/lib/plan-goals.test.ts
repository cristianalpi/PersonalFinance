import assert from "node:assert/strict";
import { test } from "node:test";
import type { Account, Tx } from "./finance.ts";
import { goalView, paymentToClear, type Goal } from "./goals.ts";
import { assumedMinimum, planDebts, simulate, type PlanDebt } from "./planner.ts";

const base = { institution: null, credit_limit: null, annual_rate: null, monthly_payment: null, statement_day: null, due_day: null, wallet_card_name: null, opening_date: "2026-01-01" };
const acc = (a: Partial<Account> & Pick<Account, "id" | "kind" | "opening_balance">): Account => ({ ...base, name: a.id, ...a });
const goal = (g: Partial<Goal> & Pick<Goal, "kind" | "target_date">): Goal => ({ id: "g", name: "Meta", emoji: null, target_amount: null, account_id: null, start_balance: null, created_on: "2026-11-01", ...g });

test("save goal: what to set aside per month, fortnight and week, rounded up to $1.000", () => {
  const v = goalView(goal({ kind: "save", target_amount: 2_000_000, target_date: "2027-02-01" }), [{ id: "d", goal_id: "g", amount: 500_000, occurred_on: "2026-11-05" }], [], [], "2026-11-17");
  assert.equal(v.achieved, 500_000);
  assert.equal(v.remaining, 1_500_000);
  assert.equal(v.daysLeft, 76);
  assert.equal(v.perMonth, 500_000, "76 days = 3 months");
  assert.equal(v.perQuincena, 300_000, "5 fortnights");
  assert.equal(v.perWeek, 137_000, "11 weeks, rounded up");
  assert.equal(v.status, "on_track", "16 of 92 days elapsed (17%) and 25% saved: inside the 10% band");
  const more = goalView(goal({ kind: "save", target_amount: 2_000_000, target_date: "2027-02-01" }), [{ id: "d", goal_id: "g", amount: 800_000, occurred_on: "2026-11-05" }], [], [], "2026-11-17");
  assert.equal(more.status, "ahead");
});

test("save goal status: behind, done and overdue", () => {
  const g = goal({ kind: "save", target_amount: 1_000_000, target_date: "2026-12-01" });
  assert.equal(goalView(g, [], [], [], "2026-11-20").status, "behind");
  assert.equal(goalView(g, [{ id: "d", goal_id: "g", amount: 1_000_000, occurred_on: "2026-11-02" }], [], [], "2026-11-20").status, "done");
  assert.equal(goalView(g, [], [], [], "2026-12-05").status, "overdue");
});

test("payoff goal: progress from the balance when it was set, payment includes interest", () => {
  const card = acc({ id: "c", kind: "credit_card", opening_balance: 3_000_000, annual_rate: 26 });
  const paid: Tx = { id: "p", account_id: "c", source_account_id: null, kind: "payment", amount: 600_000, category: null, description: null, occurred_on: "2026-11-10", source: "manual", bill_id: null };
  const v = goalView(goal({ kind: "payoff", account_id: "c", start_balance: 3_000_000, target_date: "2027-04-30" }), [], [card], [paid], "2026-11-17");
  assert.equal(v.remaining, 2_400_000);
  assert.equal(v.progress, 0.2);
  assert.ok(v.perMonth > 2_400_000 / 6, "interest makes it more than plain division");
  assert.equal(v.perMonth, Math.ceil(paymentToClear(2_400_000, 6, 26) / 1000) * 1000);
});

test("paymentToClear at 0% is plain division", () => {
  assert.equal(paymentToClear(1_200_000, 4, null), 300_000);
  assert.equal(paymentToClear(0, 4, 20), 0);
});

const debts: PlanDebt[] = [
  { id: "cara", name: "Cara", balance: 5_000_000, annualRate: 30, minPayment: 250_000, assumedMin: false },
  { id: "chica", name: "Chica", balance: 1_000_000, annualRate: 10, minPayment: 100_000, assumedMin: false },
];

test("avalanche pays the most expensive first and saves interest over the minimum", () => {
  const min = simulate(debts, 0, "minimum");
  const ava = simulate(debts, 500_000, "avalanche");
  const snow = simulate(debts, 500_000, "snowball");
  assert.equal(ava.order[0], "cara");
  assert.equal(snow.order[0], "chica");
  assert.ok(ava.totalInterest < snow.totalInterest, "avalanche minimises interest");
  assert.ok(ava.months! < min.months!, "extra money finishes sooner");
  assert.ok(ava.totalInterest < min.totalInterest);
});

test("a minimum below the interest never finishes", () => {
  const never = simulate([{ id: "x", name: "X", balance: 10_000_000, annualRate: 30, minPayment: 100_000, assumedMin: false }], 0, "minimum");
  assert.equal(never.months, null);
  assert.equal(never.payoffMonth.x, null);
});

test("planDebts: registered payment as minimum, else 5% with a $50.000 floor", () => {
  const list = planDebts(
    [
      acc({ id: "t", kind: "credit_card", opening_balance: 4_000_000 }),
      acc({ id: "r", kind: "credit_card", opening_balance: 9_000_000, monthly_payment: 380_000 }),
      acc({ id: "a", kind: "savings", opening_balance: 1 }),
      acc({ id: "z", kind: "loan", opening_balance: 0 }),
    ],
    [],
  );
  assert.deepEqual(list.map((d) => [d.id, d.minPayment, d.assumedMin]), [["t", 200_000, true], ["r", 380_000, false]]);
  assert.equal(assumedMinimum(600_000), 50_000);
});

test("advisor snapshot lists debts, the simulation and goals in plain text", async () => {
  const { advisorContext } = await import("./advisor-context.ts");
  const text = advisorContext({
    accounts: [
      acc({ id: "a", kind: "savings", opening_balance: 2_000_000, name: "Nómina" }),
      acc({ id: "t", kind: "credit_card", opening_balance: 3_000_000, annual_rate: 26, monthly_payment: 300_000, name: "Bogotá 1" }),
    ],
    txs: [],
    bills: [{ id: "b", name: "Arriendo", amount: 1_500_000, due_day: 5, category: null }],
    goals: [goal({ kind: "save", name: "Armario", target_amount: 2_000_000, target_date: "2027-02-01" })],
    deposits: [],
    today: "2026-11-17",
  });
  const { formatCOP } = await import("./finance.ts");
  for (const piece of ["Nómina", "Bogotá 1", "26% E.A.", "Avalancha", "Arriendo", "Armario", formatCOP(2_000_000)]) {
    assert.ok(text.includes(piece), `missing ${piece}`);
  }
});
