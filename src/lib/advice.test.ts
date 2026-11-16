import assert from "node:assert/strict";
import { test } from "node:test";
import { advise, monthlyRate, monthsToPayOff } from "./advice.ts";
import type { Account, Tx } from "./finance.ts";
import { buildCalendar } from "./ics.ts";

const base = { institution: null, credit_limit: null, annual_rate: null, monthly_payment: null, statement_day: null, due_day: null, wallet_card_name: null, opening_date: "2026-01-01" };
const acc = (a: Partial<Account> & Pick<Account, "id" | "kind" | "opening_balance">): Account => ({ ...base, name: a.id, ...a });
let n = 0;
const tx = (t: Partial<Tx> & Pick<Tx, "account_id" | "kind" | "amount" | "occurred_on">): Tx => ({ id: String(++n), source_account_id: null, category: null, description: null, source: "manual", bill_id: null, ...t });
const ids = (accounts: Account[], txs: Tx[], today = "2026-11-15") => advise(accounts, txs, today).map((a) => a.id);

test("monthlyRate compounds back to the annual rate", () => {
  assert.ok(Math.abs(Math.pow(1 + monthlyRate(24), 12) - 1.24) < 1e-12);
});

test("monthsToPayOff matches a month-by-month simulation", () => {
  let balance = 10_000_000;
  let months = 0;
  while (balance > 0) {
    balance = balance * (1 + monthlyRate(20)) - 500_000;
    months++;
  }
  assert.equal(monthsToPayOff(10_000_000, 500_000, 20), months);
  assert.equal(monthsToPayOff(1_000_000, 250_000, 0), 4);
  assert.equal(monthsToPayOff(10_000_000, 100_000, 20), null, "interest is about 153.000 a month");
});

test("due soon: flagged only when close and unpaid", () => {
  const card = acc({ id: "visa", kind: "credit_card", opening_balance: 900_000, due_day: 18 });
  assert.deepEqual(ids([card], []), ["due-visa"]);
  assert.deepEqual(ids([card], [], "2026-11-01"), [], "17 days away");
  assert.deepEqual(ids([card], [tx({ account_id: "visa", kind: "payment", amount: 100_000, occurred_on: "2026-11-02" })]), []);
  assert.deepEqual(ids([acc({ ...card, opening_balance: 0 })], []), [], "nothing owed");
});

test("card usage is flagged from 70% of the limit", () => {
  const card = (owed: number) => acc({ id: "visa", kind: "credit_card", opening_balance: owed, credit_limit: 1_000_000 });
  assert.deepEqual(ids([card(690_000)], []), []);
  const [advice] = advise([card(800_000)], [], "2026-11-15");
  assert.equal(advice.id, "usage-visa");
  assert.match(advice.title, /80%/);
  assert.match(advice.detail, /500\.000/, "800.000 owed minus 30% of the limit");
});

test("avalanche points at the highest rate, and urgent items come first", () => {
  const accounts = [
    acc({ id: "credito", kind: "loan", opening_balance: 5_000_000, annual_rate: 18, monthly_payment: 400_000 }),
    acc({ id: "visa", kind: "credit_card", opening_balance: 1_000_000, annual_rate: 27, due_day: 16 }),
  ];
  const advice = advise(accounts, [], "2026-11-15");
  assert.deepEqual(advice.map((a) => a.id), ["due-visa", "payoff-credito", "avalanche"]);
  assert.match(advice[2].title, /visa/);
  assert.match(advice[2].detail, /credito/);
});

test("a loan instalment below the interest is urgent", () => {
  const loan = acc({ id: "c", kind: "loan", opening_balance: 10_000_000, annual_rate: 20, monthly_payment: 100_000 });
  assert.deepEqual(ids([loan], []), ["never-c", "avalanche"]);
});

test("coverage: warns when savings are below the instalments due within 30 days", () => {
  const loan = acc({ id: "c", kind: "loan", opening_balance: 10_000_000, monthly_payment: 800_000, due_day: 28 });
  const savings = (amount: number) => acc({ id: "a", kind: "savings", opening_balance: amount });
  const recent = [tx({ account_id: "c", kind: "payment", amount: 1, occurred_on: "2026-11-14" })];
  assert.deepEqual(ids([loan, savings(500_000)], recent), ["coverage"]);
  assert.deepEqual(ids([loan, savings(800_000)], recent), []);
});

test("spending spike compares this month with the previous three", () => {
  const a = acc({ id: "a", kind: "savings", opening_balance: 9_000_000 });
  const ocio = (month: string, amount: number) => tx({ account_id: "a", kind: "expense", amount, category: "Ocio", occurred_on: `${month}-05` });
  const history = [ocio("2026-08", 200_000), ocio("2026-09", 200_000), ocio("2026-10", 200_000)];
  assert.deepEqual(ids([a], [...history, ocio("2026-11", 250_000)]), [], "25% over is within the normal range");
  const [advice] = advise([a], [...history, ocio("2026-11", 300_000)], "2026-11-15");
  assert.equal(advice.id, "spike-Ocio");
  assert.match(advice.title, /50%/);
  assert.deepEqual(ids([a], [ocio("2026-11", 300_000)]), [], "no history, no baseline");
});

test("calendar feed: one all-day event per due date with escaped text and CRLF lines", () => {
  const ics = buildCalendar([{ id: "x", name: "Visa, oro", due_day: 31, monthly_payment: null }], "2027-01-31", 2);
  assert.ok(ics.startsWith("BEGIN:VCALENDAR\r\n") && ics.endsWith("END:VCALENDAR\r\n"));
  assert.equal(ics.split("\r\n").filter((l) => l === "BEGIN:VEVENT").length, 2);
  assert.ok(ics.includes("DTSTART;VALUE=DATE:20270131\r\nDTEND;VALUE=DATE:20270201"));
  assert.ok(ics.includes("DTSTART;VALUE=DATE:20270228\r\nDTEND;VALUE=DATE:20270301"));
  assert.ok(ics.includes("SUMMARY:Pagar Visa\\, oro\r\n"));
  assert.ok(!/\$\d/.test(ics), "no amounts when there is no instalment");
});

test("bills: urgent when overdue or within three days, silent once paid", () => {
  const bill = { id: "luz", name: "Luz", amount: null, due_day: 17, category: null };
  const run = (today: string, txs: Tx[] = []) => advise([], txs, today, [bill]).map((a) => a.title);
  assert.deepEqual(run("2026-11-13"), []);
  assert.deepEqual(run("2026-11-15"), ["Luz vence en 2 días"]);
  assert.deepEqual(run("2026-11-20"), ["Luz venció hace 3 días"]);
  assert.deepEqual(run("2026-11-20", [tx({ account_id: "a", kind: "expense", amount: 1, occurred_on: "2026-11-18", bill_id: "luz" })]), []);
});
