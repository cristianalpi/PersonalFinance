import { test } from "node:test";
import assert from "node:assert/strict";
import type { IncomeItem } from "./budget.ts";
import { calendarEntries, calendarTotals, calendarWeeks } from "./calendar.ts";
import type { ChecklistItem } from "./finance.ts";

test("calendar: weeks start on Monday and pad the edges", () => {
  const nov = calendarWeeks("2026-11"); // 1 Nov 2026 is a Sunday
  assert.deepEqual(nov[0], [null, null, null, null, null, null, "2026-11-01"]);
  assert.equal(nov.at(-1)![0], "2026-11-30");
  assert.ok(nov.every((w) => w.length === 7));
  const feb = calendarWeeks("2027-02"); // 1 Feb 2027 is a Monday, 28 days
  assert.equal(feb.length, 4);
  assert.equal(feb[0][0], "2027-02-01");
});

const item = (over: Partial<ChecklistItem>): ChecklistItem => ({
  type: "bill",
  id: "x",
  name: "X",
  due: "2026-11-05",
  expected: 100,
  paid: false,
  paidAmount: 0,
  overdue: false,
  skipped: null,
  quick: null,
  ...over,
});
const income = (over: Partial<IncomeItem>): IncomeItem => ({
  type: "income",
  id: "s",
  name: "Salario",
  due: "2026-11-30",
  expected: 7_000_000,
  received: false,
  receivedAmount: 0,
  late: false,
  skipped: null,
  accountId: null,
  once: false,
  ...over,
});

test("calendar: entries by date with their status; debts without a day go apart", () => {
  const { byDate, undated } = calendarEntries(
    [
      item({ id: "luz", name: "Luz", due: "2026-11-05", paid: true, paidAmount: 92_000 }),
      item({ id: "net", name: "Internet", due: "2026-11-05", overdue: true }),
      item({ id: "visa", type: "debt", name: "Visa", due: null, expected: null }),
      item({ id: "gym", name: "Gym", due: "2026-11-20", skipped: { id: "k", item_type: "bill", item_id: "gym", month: "2026-11", note: null } }),
    ],
    [income({ due: "2026-11-05" })],
  );
  assert.deepEqual(
    byDate["2026-11-05"].map((e) => [e.name, e.status, e.amount]),
    [
      ["Internet", "overdue", 100],
      ["Luz", "paid", 92_000],
      ["Salario", "pending", 7_000_000],
    ],
    "payments first, then incomes; a paid one shows what was paid",
  );
  assert.equal(byDate["2026-11-20"][0].status, "skipped");
  assert.deepEqual(undated.map((e) => e.id), ["visa"]);
});

test("calendar: totals count only what is still open", () => {
  const { byDate, undated } = calendarEntries(
    [item({ id: "a", expected: 100 }), item({ id: "b", paid: true, paidAmount: 50 }), item({ id: "c", type: "debt", expected: null, due: "2026-11-09" })],
    [income({ expected: 1000 }), income({ id: "p", received: true, receivedAmount: 900 })],
  );
  const all = [...Object.values(byDate).flat(), ...undated];
  assert.deepEqual(calendarTotals(all), { toPay: 100, toReceive: 1000, unknown: 1 });
});
