import assert from "node:assert/strict";
import { test } from "node:test";
import {
  balanceAt,
  monthlySeries,
  nextDueDate,
  parsePesos,
  spendingByCategory,
  todayInBogota,
  totals,
  type Account,
  type Tx,
} from "./finance.ts";

const base = {
  institution: null,
  credit_limit: null,
  annual_rate: null,
  monthly_payment: null,
  statement_day: null,
  due_day: null,
};
const ahorros: Account = { ...base, id: "a", kind: "savings", name: "Ahorros", opening_balance: 5_000_000, opening_date: "2026-09-01" };
const tarjeta: Account = { ...base, id: "t", kind: "credit_card", name: "Visa", opening_balance: 2_000_000, opening_date: "2026-09-01" };
const credito: Account = { ...base, id: "c", kind: "loan", name: "Libre inversión", opening_balance: 10_000_000, opening_date: "2026-10-15" };
const accounts = [ahorros, tarjeta, credito];

let n = 0;
const tx = (t: Partial<Tx> & Pick<Tx, "account_id" | "kind" | "amount" | "occurred_on">): Tx => ({
  id: String(++n),
  source_account_id: null,
  category: null,
  description: null,
  source: "manual",
  ...t,
});

const txs: Tx[] = [
  tx({ account_id: "a", kind: "income", amount: 3_000_000, occurred_on: "2026-09-30" }),
  tx({ account_id: "t", kind: "expense", amount: 400_000, occurred_on: "2026-10-05", category: "Ocio" }),
  tx({ account_id: "a", kind: "expense", amount: 100_000, occurred_on: "2026-10-06", category: "Mercado" }),
  tx({ account_id: "t", source_account_id: "a", kind: "payment", amount: 1_000_000, occurred_on: "2026-10-20" }),
  tx({ account_id: "c", kind: "payment", amount: 500_000, occurred_on: "2026-11-10" }),
  tx({ account_id: "t", kind: "expense", amount: 50_000, occurred_on: "2026-11-12", category: "Ocio" }),
];

test("a purchase raises card debt and a payment lowers it", () => {
  assert.equal(balanceAt(tarjeta, txs), 2_000_000 + 400_000 - 1_000_000 + 50_000);
});

test("a payment funded from savings lowers both the debt and the savings balance", () => {
  assert.equal(balanceAt(ahorros, txs), 5_000_000 + 3_000_000 - 100_000 - 1_000_000);
});

test("a payment with no source account only touches the debt", () => {
  assert.equal(balanceAt(credito, txs), 9_500_000);
});

test("balanceAt ignores movements after the cut-off date", () => {
  assert.equal(balanceAt(tarjeta, txs, "2026-10-19"), 2_400_000);
  assert.equal(balanceAt(tarjeta, txs, "2026-10-20"), 1_400_000);
});

test("totals: net worth is savings minus debt", () => {
  const t = totals(accounts, txs);
  assert.deepEqual(t, { savings: 6_900_000, debt: 1_450_000 + 9_500_000, net: 6_900_000 - 10_950_000 });
});

test("monthlySeries gives month-end balances and leaves out accounts that did not exist yet", () => {
  const series = monthlySeries(accounts, txs, "2026-11-15", 4);
  assert.deepEqual(series.map((p) => p.month), ["2026-08", "2026-09", "2026-10", "2026-11"]);
  assert.deepEqual(series[0], { month: "2026-08", label: "ago 26", savings: 0, debt: 0, net: 0, byAccount: { a: null, t: null, c: null } });
  assert.equal(series[1].savings, 8_000_000);
  assert.equal(series[1].debt, 2_000_000);
  assert.equal(series[1].byAccount.c, null);
  assert.equal(series[2].debt, 1_400_000 + 10_000_000);
  assert.equal(series[3].debt, 1_450_000 + 9_500_000);
});

test("monthlySeries cuts the current month at today", () => {
  const series = monthlySeries(accounts, txs, "2026-11-11", 1);
  assert.equal(series[0].byAccount.t, 1_400_000); // the 12 nov purchase has not happened yet
});

test("spendingByCategory counts expenses only, largest first", () => {
  assert.deepEqual(spendingByCategory(txs, "2026-10"), [
    { category: "Ocio", amount: 400_000 },
    { category: "Mercado", amount: 100_000 },
  ]);
  assert.deepEqual(spendingByCategory(txs, "2026-12"), []);
});

test("nextDueDate rolls to next month, across the year end, and clamps short months", () => {
  assert.equal(nextDueDate(20, "2026-11-15"), "2026-11-20");
  assert.equal(nextDueDate(15, "2026-11-15"), "2026-11-15");
  assert.equal(nextDueDate(5, "2026-12-15"), "2027-01-05");
  assert.equal(nextDueDate(31, "2027-02-10"), "2027-02-28");
  assert.equal(nextDueDate(30, "2027-02-28"), "2027-02-28"); // day 30 clamps to feb 28, which is today
  assert.equal(nextDueDate(27, "2027-02-28"), "2027-03-27");
});

test("parsePesos accepts thousands separators and rejects empty input", () => {
  assert.equal(parsePesos("1.500.000"), 1_500_000);
  assert.equal(parsePesos("$ 80,000"), 80_000);
  assert.equal(parsePesos("abc"), null);
});

test("todayInBogota uses Colombian time, not UTC", () => {
  assert.equal(todayInBogota(new Date("2026-11-16T03:00:00Z")), "2026-11-15");
});
