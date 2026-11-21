import { headers } from "next/headers";

/** The public address the person used, as seen behind the proxy (Easypanel, Vercel). */
export async function requestOrigin() {
  const h = await headers();
  return `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host")}`;
}
