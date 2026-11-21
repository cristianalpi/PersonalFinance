// Pieces of the links that arrive by email (confirm signup, reset password,
// invite, change email). They are user-controlled query strings, so nothing
// here trusts them.

export type EmailLinkType = "signup" | "invite" | "magiclink" | "recovery" | "email_change" | "email";

const TYPES: readonly EmailLinkType[] = ["signup", "invite", "magiclink", "recovery", "email_change", "email"];

/** The link's `type`, or null when it is not one Supabase sends. */
export function emailLinkType(raw: string | null): EmailLinkType | null {
  return TYPES.find((t) => t === raw) ?? null;
}

/**
 * Where to go after the link opens the session. Only paths inside the app:
 * anything else (another site, `//host`, `/\host`) falls back to the start, so
 * a crafted link cannot send someone elsewhere after signing them in.
 */
export function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) return "/";
  return raw;
}

/** Same rules Supabase applies by default, checked first to answer in Spanish. */
export function passwordProblem(password: string, repeat: string): string | null {
  if (password.length < 6) return "La contraseña debe tener al menos 6 caracteres.";
  if (password !== repeat) return "Las dos contraseñas no coinciden.";
  return null;
}
