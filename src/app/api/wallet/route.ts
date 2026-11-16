import { formatCOP, parseWalletAmount } from "@/lib/finance";
import { createAnonClient } from "@/lib/supabase/anon";

const str = (v: unknown) => (typeof v === "string" || typeof v === "number" ? String(v) : "");

/**
 * Receives one Apple Wallet payment from the iPhone Shortcut:
 *   POST /api/wallet   Authorization: Bearer <token>
 *   { "card": "Visa Oro", "merchant": "Éxito", "amount": "$ 85.000,00" }
 * The `message` in the reply is meant to be shown as the Shortcut's notification.
 */
export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  if (!token) return Response.json({ error: "Falta el token." }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = request.headers.get("content-type")?.includes("application/json")
      ? await request.json()
      : Object.fromEntries(await request.formData());
  } catch {
    return Response.json({ error: "No se pudo leer el cuerpo de la petición." }, { status: 400 });
  }
  if (!body || typeof body !== "object") return Response.json({ error: "Cuerpo no válido." }, { status: 400 });

  const supabase = createAnonClient();
  if (!supabase) return Response.json({ error: "El servidor no tiene Supabase configurado." }, { status: 503 });

  const amount = parseWalletAmount(body.amount);
  const merchant = str(body.merchant).slice(0, 200);
  const { data, error } = await supabase.rpc("wallet_ingest", {
    p_token: token,
    p_card: str(body.card).slice(0, 200),
    p_merchant: merchant,
    p_amount: amount ?? 0,
  });
  if (error) return Response.json({ error: "No se pudo registrar el pago." }, { status: 502 });
  if (!data) return Response.json({ error: "Token no válido." }, { status: 401 });

  const status = (data as { status: string }).status;
  const message =
    status === "posted"
      ? `Registrado: ${formatCOP(amount!)}${merchant ? ` en ${merchant}` : ""}`
      : status === "duplicate"
        ? "Ya estaba registrado."
        : "Quedó por revisar en Movimientos.";
  return Response.json({ status, message });
}
