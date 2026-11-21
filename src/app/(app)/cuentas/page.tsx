import { redirect } from "next/navigation";

/** Accounts now live where they are used: savings and cash in Inicio, cards and loans in Créditos (/deudas). */
export default async function AccountsPage({ searchParams }: { searchParams: Promise<{ nueva?: string }> }) {
  redirect((await searchParams).nueva === "1" ? "/?nueva=1" : "/");
}
