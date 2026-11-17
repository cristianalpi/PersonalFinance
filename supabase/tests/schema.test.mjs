// Runs the real migrations in an in-process Postgres (PGlite) with a minimal
// stand-in for Supabase's auth schema and roles, then exercises RLS and the
// token-gated functions the way the app and the iPhone Shortcut reach them.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { test } from "node:test";
import { PGlite } from "@electric-sql/pglite";

const dir = new URL("../migrations/", import.meta.url);
const db = new PGlite();
await db.exec(`
  create role anon nologin; create role authenticated nologin;
  create schema auth;
  create table auth.users (id uuid primary key);
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.sub', true), '')::uuid $$;
  grant usage on schema auth to anon, authenticated;
`);
for (const file of readdirSync(dir).sort()) await db.exec(readFileSync(new URL(file, dir), "utf8"));
await db.exec("grant usage on schema public to anon, authenticated");

const ANA = "00000000-0000-0000-0000-00000000000a";
const BETO = "00000000-0000-0000-0000-00000000000b";
await db.exec(`insert into auth.users values ('${ANA}'), ('${BETO}')`);

const as = async (user, sql, params = []) => {
  await db.exec(`reset role; set request.jwt.sub = '${user ?? ""}'; set role ${user ? "authenticated" : "anon"}`);
  try {
    return (await db.query(sql, params)).rows;
  } finally {
    await db.exec("reset role");
  }
};
const hash = (token) => createHash("sha256").update(token).digest("hex");

const [visa] = await as(ANA, "insert into accounts (kind, name, opening_balance, due_day, wallet_card_name) values ('credit_card', 'Visa', 100, 20, 'Visa Oro') returning id");
const [betoCard] = await as(BETO, "insert into accounts (kind, name, wallet_card_name) values ('credit_card', 'Master', 'Visa Oro') returning id");
await as(ANA, "insert into api_tokens (kind, token_hash) values ('wallet', $1), ('calendar', $2)", [hash("w-ana"), hash("c-ana")]);

const [internet] = await as(ANA, "insert into bills (name, amount, due_day, category) values ('Internet', 90000, 5, 'Hogar') returning id");
const [betoBill] = await as(BETO, "insert into bills (name, due_day) values ('Luz', 12) returning id");

test("bills: a movement can reference the user's own bill but not someone else's", async () => {
  await assert.rejects(as(ANA, "insert into transactions (account_id, kind, amount, bill_id) values ($1, 'expense', 5, $2)", [visa.id, betoBill.id]), /row-level security/);
  const rows = await as(ANA, "insert into transactions (account_id, kind, amount, bill_id) values ($1, 'expense', 5, $2) returning id", [visa.id, internet.id]);
  await as(ANA, "delete from transactions where id = $1", [rows[0].id]);
  assert.equal((await as(BETO, "select * from bills")).length, 1);
});

test("a user only sees their own accounts, and a visitor without a session sees none", async () => {
  assert.equal((await as(ANA, "select * from accounts")).length, 1);
  await assert.rejects(as(null, "select * from accounts"), /permission denied/);
});

test("RLS: a movement cannot point at someone else's account", async () => {
  await assert.rejects(as(ANA, "insert into transactions (account_id, kind, amount) values ($1, 'expense', 5)", [betoCard.id]), /row-level security/);
});

const ingest = (token, card, merchant, amount) =>
  as(null, "select wallet_ingest($1, $2, $3, $4) as r", [token, card, merchant, amount]).then((rows) => rows[0].r);

test("wallet_ingest: a bad token gets nothing and writes nothing", async () => {
  assert.equal(await ingest("nope", "Visa Oro", "Éxito", 5000), null);
  assert.equal(await ingest("c-ana", "Visa Oro", "Éxito", 5000), null, "a calendar token is not a wallet token");
  assert.equal((await as(ANA, "select * from transactions")).length, 0);
});

test("wallet_ingest: a known card posts an expense on the owner's account, matched case-insensitively", async () => {
  assert.deepEqual(await ingest("w-ana", " visa oro ", "Éxito", 85000), { status: "posted", category: null });
  const [tx] = await as(ANA, "select * from transactions");
  assert.deepEqual([tx.account_id, tx.kind, Number(tx.amount), tx.description, tx.source], [visa.id, "expense", 85000, "Éxito", "wallet"]);
  assert.equal((await as(BETO, "select * from transactions")).length, 0, "Beto's card has the same Wallet name but is untouched");
});

test("wallet_ingest: an immediate repeat is a duplicate", async () => {
  assert.deepEqual(await ingest("w-ana", "Visa Oro", "Éxito", 85000), { status: "duplicate" });
  assert.equal((await as(ANA, "select * from transactions")).length, 1);
});

test("wallet_ingest: reuses the category last given to that merchant", async () => {
  await as(ANA, "update transactions set category = 'Mercado'");
  assert.deepEqual(await ingest("w-ana", "Visa Oro", "éxito", 12000), { status: "posted", category: "Mercado" });
});

test("wallet_ingest: zero amount or unknown card goes to the review inbox, not the balance", async () => {
  assert.deepEqual(await ingest("w-ana", "Visa Oro", "", 0), { status: "review" });
  assert.deepEqual(await ingest("w-ana", "Tarjeta nueva", "Rappi", 30000), { status: "review" });
  const inbox = await as(ANA, "select card, merchant, amount from wallet_inbox order by received_at");
  assert.deepEqual(inbox.map((r) => [r.card, r.merchant, r.amount === null ? null : Number(r.amount)]), [
    ["Visa Oro", null, null],
    ["Tarjeta nueva", "Rappi", 30000],
  ]);
  assert.equal((await as(ANA, "select * from transactions")).length, 2);
});

test("calendar_feed: only the token owner's debts with a due day, and no balances", async () => {
  const rows = await as(null, "select * from calendar_feed('c-ana')");
  assert.deepEqual(rows.map((r) => [r.name, r.kind, r.due_day]), [["Internet", "bill", 5], ["Visa", "credit_card", 20]]);
  assert.deepEqual(Object.keys(rows[0]).sort(), ["due_day", "id", "kind", "monthly_payment", "name"]);
  assert.equal((await as(null, "select * from calendar_feed('w-ana')")).length, 0);
});

test("token_owner is not callable from outside", async () => {
  await assert.rejects(as(null, "select token_owner('w-ana', 'wallet')"), /permission denied/);
});

test("two accounts of one user cannot share a Wallet card name", async () => {
  await assert.rejects(as(ANA, "insert into accounts (kind, name, wallet_card_name) values ('savings', 'Débito', 'VISA ORO')"), /duplicate key/);
});

test("card look: color, last 4 digits and logo are validated", async () => {
  const set = (col, value) => as(ANA, `update accounts set ${col} = $1 where id = $2`, [value, visa.id]);
  await set("color", "#6D4AFF");
  await set("last4", "4417");
  await set("logo", "data:image/png;base64,iVBORw0KGgo=");
  await set("original_amount", 20000000);
  await assert.rejects(set("color", "red"), /check constraint/);
  await assert.rejects(set("last4", "44a7"), /check constraint/);
  await assert.rejects(set("logo", "https://example.com/logo.png"), /check constraint/, "only uploaded images, never a link to fetch");
  await assert.rejects(set("logo", "data:image/svg+xml;base64,PHN2Zz4="), /check constraint/, "no SVG: it can carry scripts");
  await assert.rejects(set("logo", "data:image/png;base64," + "A".repeat(150000)), /check constraint/);
  await assert.rejects(set("original_amount", 0), /check constraint/);
  const [row] = await as(ANA, "select color, last4 from accounts where id = $1", [visa.id]);
  assert.deepEqual([row.color, row.last4], ["#6D4AFF", "4417"]);
});

test("cash accounts are allowed and can fund a payment to a debt", async () => {
  const [cash] = await as(ANA, "insert into accounts (kind, name, opening_balance) values ('cash', 'Billetera', 300000) returning id");
  await as(ANA, "insert into transactions (account_id, source_account_id, kind, amount) values ($1, $2, 'payment', 50000)", [visa.id, cash.id]);
  await assert.rejects(as(ANA, "insert into accounts (kind, name) values ('crypto', 'X')"), /check constraint/);
});
