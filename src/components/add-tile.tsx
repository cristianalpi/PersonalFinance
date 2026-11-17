"use client";

import { openAddAccount } from "./add-account";
import type { AccountKind } from "@/lib/finance";

const TEXT: Record<AccountKind, string> = {
  savings: "Agregar cuenta de ahorros",
  cash: "Agregar efectivo",
  credit_card: "Agregar tarjeta",
  loan: "Agregar crédito",
};

/** The grey "+" at the end of each row: adds an account of that row's kind. */
export function AddTile({ kind }: { kind: AccountKind }) {
  return (
    <button
      type="button"
      onClick={() => openAddAccount(kind)}
      className="group flex aspect-[1.586] w-full flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-ink/15 bg-ink/5 text-ink-3 transition hover:border-brand/50 hover:bg-brand/8 hover:text-brand"
    >
      <span aria-hidden="true" className="flex size-14 items-center justify-center rounded-full bg-ink/8 text-3xl font-light transition group-hover:scale-110 group-hover:bg-brand/15">
        +
      </span>
      <span className="text-sm font-semibold">{TEXT[kind]}</span>
    </button>
  );
}
