import { redirect } from "next/navigation";
import { todayInBogota, type Account, type Bill, type Tx } from "./finance";

export interface InboxItem {
  id: string;
  card: string | null;
  merchant: string | null;
  amount: number | null;
  occurred_on: string;
}
import { createClient } from "./supabase/server";

const PAGE = 1000; // Supabase returns at most 1000 rows per request

/** Everything the signed-in user has recorded. Row Level Security scopes both queries to them. */
export async function loadData() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: accounts, error } = await supabase.from("accounts").select("*").order("created_at");
  if (error) throw new Error(`No se pudieron leer las cuentas: ${error.message}`);

  // Balances are sums over every movement, so a silently truncated page would
  // show wrong numbers: keep reading until a short page comes back.
  const txs: Tx[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error: txError } = await supabase
      .from("transactions")
      .select("*")
      .order("occurred_on", { ascending: false })
      .order("created_at", { ascending: false })
      .range(from, from + PAGE - 1);
    if (txError) throw new Error(`No se pudieron leer los movimientos: ${txError.message}`);
    txs.push(...(data as Tx[]));
    if (data.length < PAGE) break;
  }

  const [bills, inbox] = await Promise.all([
    supabase.from("bills").select("*").order("due_day"),
    supabase.from("wallet_inbox").select("*").order("received_at", { ascending: false }),
  ]);
  if (bills.error) throw new Error(`No se pudieron leer los recibos: ${bills.error.message}`);
  if (inbox.error) throw new Error(`No se pudo leer la bandeja de Wallet: ${inbox.error.message}`);

  return {
    supabase,
    user,
    accounts: accounts as Account[],
    txs,
    bills: bills.data as Bill[],
    inbox: inbox.data as InboxItem[],
    today: todayInBogota(),
  };
}
