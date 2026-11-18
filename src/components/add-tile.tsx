"use client";

import { openAddAccount } from "./add-account";
import { Icon, KIND_ICON } from "./icons";
import type { AccountKind } from "@/lib/finance";

const TEXT: Record<AccountKind, string> = {
  savings: "Agregar cuenta bancaria",
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
      <span aria-hidden="true" className="relative flex size-14 items-center justify-center rounded-2xl bg-ink/8 transition group-hover:scale-110 group-hover:bg-brand/15 group-active:scale-95">
        <Icon name={KIND_ICON[kind]} className="size-6" />
        <span className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full text-white shadow-md" style={{ background: "linear-gradient(135deg, var(--brand), var(--brand-2))" }}>
          <Icon name="plus" className="size-3.5" strokeWidth={2.6} />
        </span>
      </span>
      <span className="text-sm font-semibold">{TEXT[kind]}</span>
    </button>
  );
}
