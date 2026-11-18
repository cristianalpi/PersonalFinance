"use client";

import { useLinkStatus } from "next/link";
import { Spinner } from "./submit-button";

/** Inside a card link: dims the card and spins while its screen loads. */
export function LinkPending() {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-black/25 text-white transition-opacity duration-200 ${pending ? "opacity-100" : "opacity-0"}`}
    >
      {pending && <Spinner className="size-8 border-[3px]" />}
    </span>
  );
}
