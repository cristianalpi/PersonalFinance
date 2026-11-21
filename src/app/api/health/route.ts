/** Liveness check for the container platform: answers without touching Supabase. */
export function GET() {
  return Response.json({ ok: true });
}
