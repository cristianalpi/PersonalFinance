"use server";

import { createHash, randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { allowedTxKinds, parsePesos, type AccountKind, type TxKind } from "@/lib/finance";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export interface FormState {
  error?: string;
  message?: string;
  /** A freshly created token. It is only ever shown here; the database keeps its hash. */
  token?: string;
}

const text = (form: FormData, name: string) => String(form.get(name) ?? "").trim();
const DATE = /^\d{4}-\d{2}-\d{2}$/;

async function signedIn() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return supabase;
}

export async function authenticate(_prev: FormState, form: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return { error: "Falta configurar Supabase en .env.local." };
  const email = text(form, "email");
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { error: "Escribe tu correo y tu contraseña." };

  const supabase = await createClient();
  if (form.get("intent") === "signup") {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    if (!data.session) return { message: "Cuenta creada. Confirma el correo que te llegó y luego entra." };
  } else {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: "Correo o contraseña incorrectos." };
  }
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

function optionalDay(form: FormData, name: string): number | null | "invalid" {
  const raw = text(form, name);
  if (!raw) return null;
  const day = Number(raw);
  return Number.isInteger(day) && day >= 1 && day <= 31 ? day : "invalid";
}

export async function saveAccount(_prev: FormState, form: FormData): Promise<FormState> {
  const supabase = await signedIn();
  const kind = text(form, "kind") as AccountKind;
  if (!["savings", "credit_card", "loan"].includes(kind)) return { error: "Tipo de cuenta no válido." };
  const name = text(form, "name");
  if (!name) return { error: "Ponle un nombre a la cuenta." };
  const opening_balance = parsePesos(text(form, "opening_balance") || "0");
  if (opening_balance === null) return { error: "El saldo no es un número válido." };
  const opening_date = text(form, "opening_date");
  if (!DATE.test(opening_date)) return { error: "La fecha del saldo no es válida." };

  const debt = kind !== "savings";
  const statement_day = kind === "credit_card" ? optionalDay(form, "statement_day") : null;
  const due_day = debt ? optionalDay(form, "due_day") : null;
  if (statement_day === "invalid" || due_day === "invalid") return { error: "Los días deben estar entre 1 y 31." };

  const rateRaw = debt ? text(form, "annual_rate").replace(",", ".") : "";
  const annual_rate = rateRaw ? Number(rateRaw) : null;
  if (annual_rate !== null && !(annual_rate >= 0 && annual_rate < 1000)) return { error: "La tasa no es válida." };

  const { error } = await supabase.from("accounts").insert({
    kind,
    name,
    institution: text(form, "institution") || null,
    opening_balance,
    opening_date,
    credit_limit: kind === "credit_card" ? parsePesos(text(form, "credit_limit")) || null : null,
    monthly_payment: kind === "loan" ? parsePesos(text(form, "monthly_payment")) || null : null,
    annual_rate,
    statement_day,
    due_day,
  });
  if (error) return { error: `No se pudo guardar: ${error.message}` };
  revalidatePath("/", "layout");
  return { message: `${name} quedó registrada.` };
}

export async function deleteAccount(form: FormData) {
  const supabase = await signedIn();
  const { error } = await supabase.from("accounts").delete().eq("id", text(form, "id"));
  if (error) throw new Error(`No se pudo eliminar la cuenta: ${error.message}`);
  revalidatePath("/", "layout");
}

export async function saveTx(_prev: FormState, form: FormData): Promise<FormState> {
  const supabase = await signedIn();
  const kind = text(form, "kind") as TxKind;
  const account_id = text(form, "account_id");
  if (!account_id) return { error: "Elige la cuenta." };
  const amount = parsePesos(text(form, "amount"));
  if (!amount) return { error: "Escribe un monto mayor que cero." };
  const occurred_on = text(form, "occurred_on");
  if (!DATE.test(occurred_on)) return { error: "La fecha no es válida." };

  const { data: account } = await supabase.from("accounts").select("kind").eq("id", account_id).maybeSingle();
  if (!account) return { error: "Esa cuenta ya no existe." };
  if (!allowedTxKinds(account.kind as AccountKind).includes(kind)) {
    return { error: "Ese tipo de movimiento no aplica a esa cuenta." };
  }

  let source_account_id: string | null = null;
  if (kind === "payment") {
    source_account_id = text(form, "source_account_id") || null;
    if (source_account_id) {
      const { data: source } = await supabase.from("accounts").select("kind").eq("id", source_account_id).maybeSingle();
      if (source?.kind !== "savings") return { error: "El pago debe salir de una cuenta de ahorros." };
    }
  }

  const { error } = await supabase.from("transactions").insert({
    kind,
    account_id,
    source_account_id,
    amount,
    occurred_on,
    category: kind === "expense" ? text(form, "category") || null : null,
    description: text(form, "description") || null,
  });
  if (error) return { error: `No se pudo guardar: ${error.message}` };
  revalidatePath("/", "layout");
  return { message: "Movimiento registrado." };
}

export async function deleteTx(form: FormData) {
  const supabase = await signedIn();
  const { error } = await supabase.from("transactions").delete().eq("id", text(form, "id"));
  if (error) throw new Error(`No se pudo eliminar el movimiento: ${error.message}`);
  revalidatePath("/", "layout");
}

export async function saveBill(_prev: FormState, form: FormData): Promise<FormState> {
  const supabase = await signedIn();
  const name = text(form, "name");
  if (!name) return { error: "Ponle un nombre al recibo." };
  const due_day = optionalDay(form, "due_day");
  if (due_day === null || due_day === "invalid") return { error: "El día de pago debe estar entre 1 y 31." };
  const amountRaw = text(form, "amount");
  const amount = amountRaw ? parsePesos(amountRaw) : null;
  if (amountRaw && !amount) return { error: "El valor no es válido." };

  const { error } = await supabase.from("bills").insert({ name, due_day, amount, category: text(form, "category") || null });
  if (error) return { error: `No se pudo guardar: ${error.message}` };
  revalidatePath("/", "layout");
  return { message: `${name} quedó registrado.` };
}

export async function deleteBill(form: FormData) {
  const supabase = await signedIn();
  const { error } = await supabase.from("bills").delete().eq("id", text(form, "id"));
  if (error) throw new Error(`No se pudo eliminar el recibo: ${error.message}`);
  revalidatePath("/", "layout");
}

/** Records this month's payment of a fixed bill as an expense on the chosen account. */
export async function payBill(_prev: FormState, form: FormData): Promise<FormState> {
  const supabase = await signedIn();
  const amount = parsePesos(text(form, "amount"));
  if (!amount) return { error: "Escribe cuánto pagaste." };
  const account_id = text(form, "account_id");
  if (!account_id) return { error: "Elige con qué pagaste." };
  const occurred_on = text(form, "occurred_on");
  if (!DATE.test(occurred_on)) return { error: "La fecha no es válida." };

  const { data: bill } = await supabase.from("bills").select("id, name, category").eq("id", text(form, "bill_id")).maybeSingle();
  if (!bill) return { error: "Ese recibo ya no existe." };

  const { error } = await supabase.from("transactions").insert({
    kind: "expense",
    account_id,
    amount,
    occurred_on,
    bill_id: bill.id,
    category: bill.category ?? "Recibos",
    description: bill.name,
  });
  if (error) return { error: `No se pudo guardar: ${error.message}` };
  revalidatePath("/", "layout");
  return { message: "Pago registrado." };
}

/** Creates (or replaces) the user's token of one kind and returns it once. */
export async function createToken(_prev: FormState, form: FormData): Promise<FormState> {
  const supabase = await signedIn();
  const kind = text(form, "kind");
  if (kind !== "wallet" && kind !== "calendar") return { error: "Tipo de token no válido." };

  const token = randomBytes(24).toString("base64url");
  const token_hash = createHash("sha256").update(token).digest("hex");
  const removed = await supabase.from("api_tokens").delete().eq("kind", kind);
  if (removed.error) return { error: `No se pudo reemplazar el token: ${removed.error.message}` };
  const { error } = await supabase.from("api_tokens").insert({ kind, token_hash });
  if (error) return { error: `No se pudo crear el token: ${error.message}` };
  revalidatePath("/ajustes");
  return { token };
}

export async function clearWalletName(form: FormData) {
  const supabase = await signedIn();
  const { error } = await supabase.from("accounts").update({ wallet_card_name: null }).eq("id", text(form, "id"));
  if (error) throw new Error(`No se pudo desvincular la tarjeta: ${error.message}`);
  revalidatePath("/", "layout");
}

/** Turns a Wallet payment that needed review into an expense, optionally remembering the card. */
export async function resolveInbox(_prev: FormState, form: FormData): Promise<FormState> {
  const supabase = await signedIn();
  const amount = parsePesos(text(form, "amount"));
  if (!amount) return { error: "Escribe el monto." };
  const account_id = text(form, "account_id");
  if (!account_id) return { error: "Elige la cuenta o tarjeta." };

  const { data: item } = await supabase.from("wallet_inbox").select("*").eq("id", text(form, "id")).maybeSingle();
  if (!item) return { error: "Ese pago ya fue revisado." };

  if (form.get("remember") && item.card) {
    const linked = await supabase.from("accounts").update({ wallet_card_name: item.card }).eq("id", account_id);
    if (linked.error) {
      return { error: linked.error.code === "23505" ? `Ya hay otra cuenta vinculada a «${item.card}».` : linked.error.message };
    }
  }

  const { error } = await supabase.from("transactions").insert({
    kind: "expense",
    account_id,
    amount,
    occurred_on: item.occurred_on,
    category: text(form, "category") || null,
    description: text(form, "description") || item.merchant,
    source: "wallet",
  });
  if (error) return { error: `No se pudo guardar: ${error.message}` };

  const removed = await supabase.from("wallet_inbox").delete().eq("id", item.id);
  if (removed.error) return { error: `El gasto quedó registrado, pero no se pudo quitar de la bandeja: ${removed.error.message}` };
  revalidatePath("/", "layout");
  return { message: "Registrado." };
}

export async function discardInbox(form: FormData) {
  const supabase = await signedIn();
  const { error } = await supabase.from("wallet_inbox").delete().eq("id", text(form, "id"));
  if (error) throw new Error(`No se pudo descartar: ${error.message}`);
  revalidatePath("/", "layout");
}
