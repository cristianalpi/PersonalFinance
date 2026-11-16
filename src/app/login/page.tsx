import { isSupabaseConfigured } from "@/lib/supabase/server";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-6 px-5">
      <div>
        <p className="eyebrow">Finanzas</p>
        <h1 className="mt-1 text-2xl font-semibold">Entra a tus cuentas</h1>
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
