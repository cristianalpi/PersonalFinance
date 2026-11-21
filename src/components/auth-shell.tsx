import { Logo } from "@/components/logo";
import { APP_NAME } from "@/lib/brand";

/** The narrow centered frame of the screens outside the app: login, password recovery, new password. */
export function AuthShell({ subtitle, children }: { subtitle: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-6 px-5">
      <div>
        <Logo size="text-4xl" />
        <h1 className="sr-only">{APP_NAME}</h1>
        <p className="mt-3 text-ink-2">{subtitle}</p>
      </div>
      {children}
    </main>
  );
}
