import { test } from "node:test";
import assert from "node:assert/strict";
import { emailLinkType, passwordProblem, safeNext } from "./auth-links.ts";

test("auth links: only known link types", () => {
  assert.equal(emailLinkType("recovery"), "recovery");
  assert.equal(emailLinkType("email"), "email");
  assert.equal(emailLinkType("admin"), null);
  assert.equal(emailLinkType(null), null);
});

test("auth links: next stays inside the app", () => {
  assert.equal(safeNext("/nueva-clave"), "/nueva-clave");
  assert.equal(safeNext("/cuentas/abc?x=1"), "/cuentas/abc?x=1");
  assert.equal(safeNext(null), "/");
  assert.equal(safeNext(""), "/");
  assert.equal(safeNext("https://evil.example"), "/");
  assert.equal(safeNext("//evil.example"), "/");
  assert.equal(safeNext("/\\evil.example"), "/");
});

test("auth links: password checks", () => {
  assert.match(passwordProblem("123", "123") ?? "", /6 caracteres/);
  assert.match(passwordProblem("secreto1", "secreto2") ?? "", /no coinciden/);
  assert.equal(passwordProblem("secreto1", "secreto1"), null);
});
