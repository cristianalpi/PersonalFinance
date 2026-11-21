"use client";

import { useFormStatus } from "react-dom";

/** A small spinning ring, sized to the text around it. */
export function Spinner({ className = "size-[1em]" }: { className?: string }) {
  return <span aria-hidden="true" className={`spinner ${className}`} />;
}

/**
 * A form's submit button that shows it is working: it disables itself and
 * spins while the server action runs, so a second tap does not send it twice.
 * When a form has several (Entrar / Crear cuenta, told apart by name and value),
 * all are disabled but only the one pressed spins.
 */
export function SubmitButton({ children, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { pending, data } = useFormStatus();
  const pressed = pending && (!props.name || props.value === undefined || data?.get(props.name) === String(props.value));
  return (
    <button {...props} className={`${className} relative`} disabled={pending || props.disabled} aria-busy={pressed}>
      <span className={`inline-flex items-center gap-1.5 ${pressed ? "opacity-0" : ""}`}>{children}</span>
      {pressed && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Spinner />
        </span>
      )}
    </button>
  );
}
