import { todayInBogota } from "@/lib/finance";
import { buildCalendar, type DueItem } from "@/lib/ics";
import { createAnonClient } from "@/lib/supabase/anon";

/** iCalendar feed with the next payment dates. The token in the URL is the only credential. */
export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const token = (await params).token.replace(/\.ics$/, "");
  const supabase = createAnonClient();
  if (!supabase) return new Response("Supabase no está configurado.", { status: 503 });

  const { data, error } = await supabase.rpc("calendar_feed", { p_token: token });
  if (error) return new Response("No se pudo generar el calendario.", { status: 502 });

  // An unknown token yields an empty calendar: the reply does not reveal whether a token exists.
  return new Response(buildCalendar((data ?? []) as DueItem[], todayInBogota()), {
    headers: { "content-type": "text/calendar; charset=utf-8", "cache-control": "private, max-age=3600" },
  });
}
