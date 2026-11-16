import { Logo } from "@/components/logo";
import { APP_NAME, APP_TAGLINE } from "@/lib/brand";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-6 px-5">
      <div>
        <Logo size="text-4xl" />
        <h1 className="sr-only">{APP_NAME}</h1>
        <p className="mt-3 text-ink-2">{APP_TAGLINE}</p>
      </div>
      {isSupabaseConfigured ? (
        <LoginForm />
      ) : (
        <p className="card text-sm text-ink-2">
          Falta conectar Supabase. Copia <code className="num">.env.example</code> a{" "}
          <code className="num">.env.local</code>, pon la URL y la clave de tu proyecto y reinicia el servidor.
        </p>
      )}
    </main>
  );
}
