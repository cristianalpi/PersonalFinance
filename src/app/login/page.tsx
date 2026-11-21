import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { APP_TAGLINE } from "@/lib/brand";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { LoginForm } from "./login-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ enlace?: string }> }) {
  const { enlace } = await searchParams;

  return (
    <AuthShell subtitle={APP_TAGLINE}>
      {isSupabaseConfigured ? (
        <>
          {enlace === "vencido" && (
            <p role="alert" className="alert">
              Ese enlace ya se usó o venció. Entra con tu contraseña o{" "}
              <Link href="/recuperar" className="font-medium underline">
                pide uno nuevo
              </Link>
              .
            </p>
          )}
          <LoginForm />
          <Link href="/recuperar" className="text-center text-sm font-medium text-brand">
            ¿Olvidaste tu contraseña?
          </Link>
        </>
      ) : (
        <p className="card text-sm text-ink-2">
          Falta conectar Supabase. Copia <code className="num">.env.example</code> a{" "}
          <code className="num">.env.local</code>, pon la URL y la clave de tu proyecto y reinicia el servidor.
        </p>
      )}
    </AuthShell>
  );
}
