import { AuthShell } from "@/components/auth-shell";
import { NewPasswordForm } from "./new-password-form";

/** Reached from the reset or invite email (through /auth/confirm, which opened the session). */
export default function NewPasswordPage() {
  return (
    <AuthShell subtitle="Elige tu contraseña nueva. La usarás para entrar desde ahora.">
      <NewPasswordForm />
    </AuthShell>
  );
}
