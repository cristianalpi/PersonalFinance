"use client";

import { useState } from "react";

const TEXT = "Te invito a Guaca: ve en un solo lugar lo que tienes, lo que debes y lo que vas a pagar este mes. Crea tu cuenta aquí:";

/**
 * Invites someone with a link to the signup screen. Phones open their share
 * sheet (WhatsApp, Messages…); elsewhere the link is copied. Nothing is sent
 * from the server and no admin key is needed: the friend signs up on their own.
 */
export function ShareInvite({ origin }: { origin: string }) {
  const url = `${origin}/login?registro=1`;
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  async function share() {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: "Guaca", text: TEXT, url });
        return;
      } catch (error) {
        // Closing the share sheet is not an error worth showing.
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(`${TEXT} ${url}`);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button type="button" className="btn" onClick={share}>
        Invitar a alguien
      </button>
      {status === "copied" && (
        <p role="status" className="text-sm text-ink-2">
          Copiamos la invitación. Pégala en WhatsApp o donde quieras.
        </p>
      )}
      {status === "failed" && (
        <p role="status" className="text-sm text-ink-2">
          Comparte esta dirección: <code className="break-all">{url}</code>
        </p>
      )}
    </div>
  );
}
