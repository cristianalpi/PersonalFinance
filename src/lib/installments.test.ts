import { test } from "node:test";
import assert from "node:assert/strict";
import {
  firstMonthFor,
  installmentPayment,
  installmentsPaid,
  lastDueMonth,
  purchaseView,
  purchasesSummary,
  remainingPrincipal,
  scheduleView,
  type CardPurchase,
} from "./installments.ts";

test("instalments: a month counts once its payment day has come", () => {
  assert.equal(lastDueMonth(15, "2026-11-14"), "2026-10");
  assert.equal(lastDueMonth(15, "2026-11-15"), "2026-11");
  assert.equal(lastDueMonth(31, "2026-02-28"), "2026-02", "day 31 falls on the last day of a short month");
  assert.equal(lastDueMonth(null, "2026-11-30"), "2026-10", "without a payment day, only ended months count");
  assert.equal(lastDueMonth(5, "2026-01-02"), "2025-12");
});

test("instalments: paid so far follows the calendar and stays within the total", () => {
  assert.equal(installmentsPaid("2026-09", 12, 15, "2026-11-20"), 3);
  assert.equal(installmentsPaid("2026-09", 12, 15, "2026-11-10"), 2);
  assert.equal(installmentsPaid("2027-01", 12, 15, "2026-11-20"), 0, "not started yet");
  assert.equal(installmentsPaid("2024-01", 12, 15, "2026-11-20"), 12, "never more than the total");
});

test("instalments: «cuotas ya pagadas» and the first month round-trip", () => {
  for (const [paid, dueDay, today] of [
    [0, 15, "2026-11-20"],
    [7, 15, "2026-11-10"],
    [14, null, "2026-11-21"],
    [1, 31, "2026-02-28"],
  ] as const) {
    assert.equal(installmentsPaid(firstMonthFor(paid, dueDay, today), 48, dueDay, today), paid);
  }
  assert.equal(firstMonthFor(0, 15, "2026-11-20"), "2026-12", "nothing paid: the first instalment is next month");
});

test("instalments: payment and balance of a French schedule", () => {
  assert.equal(installmentPayment(1_200_000, 12, null), 100_000);
  assert.equal(installmentPayment(1_200_000, 12, 0), 100_000);
  const payment = installmentPayment(12_000_000, 36, 26.8);
  assert.ok(payment > 12_000_000 / 36 && payment < 500_000, `cuota razonable: ${payment}`);
  assert.equal(remainingPrincipal(12_000_000, 36, 26.8, 0), 12_000_000);
  assert.equal(remainingPrincipal(12_000_000, 36, 26.8, 36), 0);
  const half = remainingPrincipal(12_000_000, 36, 26.8, 18);
  assert.ok(half > 6_000_000, "with interest, less than half the principal is gone at half the term");
  assert.equal(remainingPrincipal(1_200_000, 12, null, 3), 900_000);
});

test("instalments: schedule and purchase views", () => {
  const s = scheduleView("2026-01", 36, 10, "2026-11-21");
  assert.deepEqual([s.paid, s.left, s.endsMonth, s.nextMonth, s.done], [11, 25, "2028-12", "2026-12", false]);

  const tv: CardPurchase = {
    id: "1",
    account_id: "visa",
    description: "Televisor",
    amount: 2_400_000,
    installments: 12,
    first_due_month: "2026-09",
    monthly_payment: null,
    annual_rate: null,
    rate_type: null,
    refinanced: false,
  };
  const v = purchaseView(tv, 15, "2026-11-20");
  assert.deepEqual([v.paid, v.left, v.payment, v.paymentIsEstimate, v.remaining], [3, 9, 200_000, true, 1_800_000]);
  const billed = purchaseView({ ...tv, monthly_payment: 231_000 }, 15, "2026-11-20");
  assert.deepEqual([billed.payment, billed.paymentIsEstimate], [231_000, false]);

  const done = purchaseView({ ...tv, first_due_month: "2025-01" }, 15, "2026-11-20");
  assert.deepEqual(purchasesSummary([v, done]), { active: 1, monthly: 200_000, remaining: 1_800_000 });
});
