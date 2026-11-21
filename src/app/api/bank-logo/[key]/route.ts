import { bankAppStoreId, bankDomains } from "@/lib/banks";

const WEEK = 60 * 60 * 24 * 7;
const DAY = 60 * 60 * 24;

/**
 * The current icon of a bank's official app. Apple's lookup gives its address; only images on
 * Apple's own image servers are accepted. Asked as a 128 px PNG, like the favicons.
 */
async function appStoreIcon(id: string): Promise<string | null> {
  const res = await fetch(`https://itunes.apple.com/lookup?id=${id}&country=co`, { next: { revalidate: WEEK } }).catch(() => null);
  if (!res?.ok) return null;
  const data = await res.json().catch(() => null);
  const art: unknown = data?.results?.[0]?.artworkUrl512 ?? data?.results?.[0]?.artworkUrl100;
  if (typeof art !== "string" || !URL.canParse(art)) return null;
  const url = new URL(art);
  if (url.protocol !== "https:" || !url.hostname.endsWith(".mzstatic.com")) return null;
  return art.replace(/\/\d+x\d+bb\.(jpg|png|webp)$/, "/128x128bb.png");
}

/**
 * The icon of a known bank, fetched by the server and cached, so the person's
 * browser never tells a third party which banks they use. Only the banks in the
 * list can be requested: first their official app's icon, then their websites.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ key: string }> }) {
  const key = (await params).key;
  const domains = bankDomains(key);
  if (domains.length === 0) return new Response("Banco desconocido.", { status: 404 });

  const appId = bankAppStoreId(key);
  const app = appId ? await appStoreIcon(appId) : null;
  const sources = [...(app ? [app] : []), ...domains.map((d) => `https://www.google.com/s2/favicons?domain=${d}&sz=128`)];

  // Google answers 404 (with a generic globe) when it has no icon for a site: try the next one,
  // and pass the 404 on at the end so the card shows initials.
  for (const source of sources) {
    const upstream = await fetch(source, { next: { revalidate: WEEK } }).catch(() => null);
    const type = upstream?.headers.get("content-type") ?? "";
    if (!upstream?.ok || !type.startsWith("image/")) continue;
    const body = await upstream.arrayBuffer();
    if (body.byteLength < 200) continue; // a blank placeholder, not a logo
    // A day in the browser (the server keeps its copy a week), so a corrected logo shows up soon.
    return new Response(body, {
      headers: { "content-type": type, "cache-control": `public, max-age=${DAY}, stale-while-revalidate=${WEEK}` },
    });
  }
  return new Response("Sin logo.", { status: 404 });
}
