import { bankDomains } from "@/lib/banks";

const WEEK = 60 * 60 * 24 * 7;

/**
 * The icon of a known bank, fetched by the server and cached, so the person's
 * browser never tells a third party which banks they use. Only the domains in
 * the bank list can be requested.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ key: string }> }) {
  const domains = bankDomains((await params).key);
  if (domains.length === 0) return new Response("Banco desconocido.", { status: 404 });

  // Google answers 404 (with a generic globe) when it has no icon for a site: try the next one,
  // and pass the 404 on at the end so the card shows initials.
  for (const domain of domains) {
    const upstream = await fetch(`https://www.google.com/s2/favicons?domain=${domain}&sz=128`, {
      next: { revalidate: WEEK },
    }).catch(() => null);
    const type = upstream?.headers.get("content-type") ?? "";
    if (!upstream?.ok || !type.startsWith("image/")) continue;
    const body = await upstream.arrayBuffer();
    if (body.byteLength < 200) continue; // a blank placeholder, not a logo
    return new Response(body, {
      headers: { "content-type": type, "cache-control": `public, max-age=${WEEK}, stale-while-revalidate=${WEEK}` },
    });
  }
  return new Response("Sin logo.", { status: 404 });
}
