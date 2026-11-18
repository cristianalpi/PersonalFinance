"use client";

import { useFormStatus } from "react-dom";

/** A small spinning ring, sized to the text around it. */
export function Spinner({ className = "size-[1em]" }: { className?: string }) {
  return <span aria-hidden="true" className={`spinner ${className}`} />;
}

/**
 * A form's submit button that shows it is working: it disables itself and
 * spins while the server action runs, so a second tap does not send it twice.
 */
export function SubmitButton({ children, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { pending } = useFormStatus();
  return (
    <button {...props} className={`${className} relative`} disabled={pending || props.disabled} aria-busy={pending}>
      <span className={`inline-flex items-center gap-1.5 ${pending ? "opacity-0" : ""}`}>{children}</span>
      {pending && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Spinner />
        </span>
      )}
    </button>
  );
}
