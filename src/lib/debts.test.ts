import assert from "node:assert/strict";
import { test } from "node:test";
import { bankColor, bankDomain, bankKey, cardColor, cardInk, contrast, initials } from "./banks.ts";
import { debtView, payFirst, usageLevel } from "./debts.ts";
import { formatPesosInput, txIcon, type Account, type Tx } from "./finance.ts";

const base = { institution: null, credit_limit: null, annual_rate: null, monthly_payment: null, statement_day: null, due_day: null, wallet_card_name: null, opening_date: "2026-01-01" };
const acc = (a: Partial<Account> & Pick<Account, "id" | "kind" | "opening_balance">): Account => ({ ...base, name: a.id, ...a });
const pay = (account_id: string, amount: number): Tx => ({ id: account_id + amount, account_id, source_account_id: null, kind: "payment", amount, category: null, description: null, occurred_on: "2026-11-02", source: "manual", bill_id: null });

test("card: usage of the limit and what is still available", () => {
  const v = debtView(acc({ id: "visa", kind: "credit_card", opening_balance: 2_400_000, credit_limit: 8_000_000, due_day: 20 }), [], "2026-11-17");
  assert.equal(v.usage, 0.3);
  assert.equal(v.available, 5_600_000);
  assert.equal(v.paidShare, null);
  assert.equal(v.nextDue, "2026-11-20");
  assert.equal(v.daysToDue, 3);
});

test("card over its limit reports more than 100% and nothing available", () => {
  const v = debtView(acc({ id: "v", kind: "credit_card", opening_balance: 1_100_000, credit_limit: 1_000_000 }), [], "2026-11-17");
  assert.equal(v.usage, 1.1);
  assert.equal(v.available, 0);
});

test("loan: progress is measured from the original amount when it is known", () => {
  const loan = acc({ id: "c", kind: "loan", opening_balance: 18_000_000, original_amount: 24_000_000, monthly_payment: 780_000, annual_rate: 19.2 });
  const v = debtView(loan, [pay("c", 3_000_000)], "2026-11-17");
  assert.equal(v.balance, 15_000_000);
  assert.equal(v.paidShare, 9_000_000 / 24_000_000);
  assert.ok(v.baseIsOriginal);
  assert.ok(v.monthsLeft! > 0 && v.endsIn !== null);
  assert.equal(v.monthlyInterest, Math.round(15_000_000 * (Math.pow(1.192, 1 / 12) - 1)));
});

test("loan without original amount measures from the registered balance", () => {
  const v = debtView(acc({ id: "c", kind: "loan", opening_balance: 10_000_000 }), [pay("c", 2_500_000)], "2026-11-17");
  assert.equal(v.paidShare, 0.25);
  assert.equal(v.baseIsOriginal, false);
  assert.equal(v.monthsLeft, null, "no instalment or rate, no estimate");
});

test("a paid-off debt has no next due date or interest", () => {
  const v = debtView(acc({ id: "c", kind: "loan", opening_balance: 500_000, due_day: 5, annual_rate: 20 }), [pay("c", 500_000)], "2026-11-17");
  assert.deepEqual([v.balance, v.paidShare, v.nextDue, v.monthlyInterest], [0, 1, null, null]);
});

test("usage bands and the debt to pay first", () => {
  assert.deepEqual([0.29, 0.3, 0.69, 0.7].map(usageLevel), ["low", "mid", "mid", "high"]);
  const views = [
    debtView(acc({ id: "a", kind: "loan", opening_balance: 1, annual_rate: 18 }), [], "2026-11-17"),
    debtView(acc({ id: "b", kind: "credit_card", opening_balance: 1, annual_rate: 27 }), [], "2026-11-17"),
  ];
  assert.equal(payFirst(views), "b");
  assert.equal(payFirst(views.slice(0, 1)), null, "one debt: nothing to rank");
});

test("card colours: user choice, then bank, then a stable pick; text always readable", () => {
  assert.equal(bankColor("Bancolombia S.A."), "#FDDA24");
  assert.equal(bankColor("Nu Colombia"), "#820AD1");
  assert.equal(bankColor("Cooperativa X"), null);
  assert.equal(cardColor({ color: "#123456", institution: "Bancolombia", name: "x" }), "#123456");
  assert.equal(cardColor({ institution: "Davivienda", name: "x" }), "#E30613");
  assert.equal(cardColor({ institution: null, name: "Ahorros" }), cardColor({ institution: null, name: "Ahorros" }));
  for (const hex of ["#FDDA24", "#004481", "#E30613", "#00B894", "#F2C500", "#6D4AFF"]) {
    assert.ok(contrast(cardInk(hex), hex) >= 4.5, `${hex} with ${cardInk(hex)}`);
  }
  assert.equal(initials("Banco de Bogotá"), "B");
  assert.equal(initials("Scotiabank Colpatria"), "SC");
});

test("money fields format as the person types", () => {
  assert.equal(formatPesosInput("1500000"), "$ 1.500.000");
  assert.equal(formatPesosInput("$ 1.500.0007"), "$ 15.000.007");
  assert.equal(formatPesosInput("00085"), "$ 85");
  assert.equal(formatPesosInput(""), "");
  assert.equal(formatPesosInput(89900), "$ 89.900");
});

test("movement icons by category and kind", () => {
  assert.equal(txIcon({ kind: "expense", category: "Mercado" }), "🛒");
  assert.equal(txIcon({ kind: "expense", category: " ocio " }), "🎬");
  assert.equal(txIcon({ kind: "expense", category: "Mascotas" }), "🧾");
  assert.equal(txIcon({ kind: "income", category: null }), "💰");
  assert.equal(txIcon({ kind: "payment", category: null }), "💳");
});

test("automatic logos only for known banks, and only from their listed websites", () => {
  assert.equal(bankKey("Davivienda"), "davivienda");
  assert.equal(bankKey("DaviPlata"), "daviplata", "DaviPlata is not mistaken for Davivienda");
  assert.equal(bankKey("Mi cooperativa"), null);
  assert.equal(bankDomain("bancolombia"), "bancolombia.com");
  assert.equal(bankDomain("evil.com"), null);
});

test("banks: Davibank and the Rappi cards get their own logos", async () => {
  const { bankDomains } = await import("./banks.ts");
  assert.equal(bankKey("Davibank"), "davibank");
  assert.equal(bankKey("DAVIbank"), "davibank");
  assert.equal(bankKey("Davivienda"), "davivienda");
  assert.equal(bankKey("RappiCard"), "rappi");
  assert.equal(bankKey("RappiPay"), "rappi");
  assert.deepEqual(bankDomains("davibank"), ["davibank.com.co", "davibank.com", "davivienda.com"]);
});
