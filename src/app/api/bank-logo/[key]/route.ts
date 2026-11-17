import { bankDomain } from "@/lib/banks";

const WEEK = 60 * 60 * 24 * 7;

/**
 * The icon of a known bank, fetched by the server and cached, so the person's
 * browser never tells a third party which banks they use. Only the domains in
 * the bank list can be requested.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ key: string }> }) {
  const domain = bankDomain((await params).key);
  if (!domain) return new Response("Banco desconocido.", { status: 404 });

  const upstream = await fetch(`https://www.google.com/s2/favicons?domain=${domain}&sz=128`, {
    next: { revalidate: WEEK },
  }).catch(() => null);
  // Google answers 404 (with a generic globe) when it has no icon: pass the 404 on so the card shows initials.
  if (!upstream?.ok) return new Response("Sin logo.", { status: 404 });

  const type = upstream.headers.get("content-type") ?? "";
  if (!type.startsWith("image/")) return new Response("Sin logo.", { status: 404 });

  return new Response(await upstream.arrayBuffer(), {
    headers: { "content-type": type, "cache-control": `public, max-age=${WEEK}, stale-while-revalidate=${WEEK}` },
  });
}
