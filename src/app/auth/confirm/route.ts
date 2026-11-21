import { redirect } from "next/navigation";
import { emailLinkType, safeNext } from "@/lib/auth-links";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

/**
 * Where every email link lands (confirm signup, reset password, invite, change
 * email). It opens the session and goes on to `next`.
 *
 * - `token_hash` + `type`: the links in our email templates. They work even
 *   when the email is opened on another device.
 * - `code`: Supabase's default links. They only work in the browser that asked
 *   for the email, because the PKCE verifier lives in its cookies.
 */
export async function GET(request: Request) {
  if (!isSupabaseConfigured) redirect("/login");
  const params = new URL(request.url).searchParams;
  const next = safeNext(params.get("next"));
  const tokenHash = params.get("token_hash");
  const type = emailLinkType(params.get("type"));
  const code = params.get("code");

  const supabase = await createClient();
  let opened = false;
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    opened = !error;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    opened = !error;
  }

  redirect(opened ? next : "/login?enlace=vencido");
}
