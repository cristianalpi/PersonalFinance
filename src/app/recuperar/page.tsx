import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { ResetForm } from "./reset-form";

export default function RecoverPage() {
  return (
    <AuthShell subtitle="Te enviamos un enlace al correo para que elijas una contraseña nueva.">
      <ResetForm />
      <Link href="/login" className="text-center text-sm font-medium text-brand">
        Volver a entrar
      </Link>
    </AuthShell>
  );
}
