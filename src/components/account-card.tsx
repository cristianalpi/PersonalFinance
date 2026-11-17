import { bankKey, cardColor, cardInk, initials, shade } from "@/lib/banks";
import { BankLogo } from "./bank-logo";
import { KIND_LABEL, formatCOP, type Account } from "@/lib/finance";

type CardAccount = Pick<Account, "kind" | "name" | "institution" | "color" | "last4" | "logo">;

/**
 * An account drawn as a card, in its bank's colour (or the one chosen), with
 * the bank image the user uploaded or a monogram. Text colour is picked for
 * contrast against the card. `children` sits at the bottom (a usage bar, for example).
 */
export function AccountCard({
  account,
  balance,
  caption,
  size = "md",
  children,
}: {
  account: CardAccount;
  balance?: number;
  caption?: string;
  size?: "sm" | "md" | "lg";
  children?: React.ReactNode;
}) {
  const color = cardColor(account);
  const ink = cardInk(color);
  const light = ink === "#FFFFFF";
  const mark = account.institution || account.name;
  const big = size === "lg";
  // Uploaded image first; then the bank's own icon when the bank is known; else initials.
  const bank = bankKey(account.institution);
  const monogram = (
    <span
      aria-hidden="true"
      className="display flex size-10 shrink-0 items-center justify-center rounded-xl text-sm"
      style={{ background: light ? "rgba(255,255,255,0.22)" : "rgba(20,17,46,0.12)" }}
    >
      {account.kind === "cash" ? <span className="text-xl">💵</span> : initials(mark)}
    </span>
  );

  return (
    <div
      className={`relative isolate flex flex-col justify-between overflow-hidden rounded-3xl shadow-[0_18px_40px_-18px_rgba(30,20,90,0.55)] ${
        size === "sm" ? "min-h-36 gap-3 p-4" : big ? "aspect-[1.586] max-w-md gap-4 p-6" : "aspect-[1.586] gap-4 p-5"
      }`}
      style={{ background: `linear-gradient(135deg, ${color} 0%, ${shade(color, 0.28)} 100%)`, color: ink }}
    >
      {/* Light that sweeps across the card, and two soft rings: decoration only. */}
      <span aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 -z-10 size-56 rounded-full border-[28px] opacity-15" style={{ borderColor: ink }} />
      <span aria-hidden="true" className="pointer-events-none absolute -bottom-24 -left-10 -z-10 size-56 rounded-full opacity-10" style={{ background: ink }} />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: `linear-gradient(115deg, ${light ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.4)"} 0%, transparent 38%)` }}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          {account.logo ? (
            // eslint-disable-next-line @next/next/no-img-element -- a small data URL the user uploaded; nothing to optimise
            <img src={account.logo} alt="" className="size-10 shrink-0 rounded-xl bg-white object-contain p-1 shadow-sm" />
          ) : bank ? (
            <BankLogo key={bank} bank={bank} fallback={monogram} />
          ) : (
            monogram
          )}
          {account.institution && <span className="truncate text-sm font-semibold">{account.institution}</span>}
        </div>
        <span
          className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold"
          style={{ background: light ? "rgba(255,255,255,0.2)" : "rgba(20,17,46,0.1)" }}
        >
          {KIND_LABEL[account.kind]}
        </span>
      </div>

      {account.kind === "credit_card" && size !== "sm" && (
        <span
          aria-hidden="true"
          className="h-8 w-11 shrink-0 rounded-md"
          style={{ background: "linear-gradient(135deg, #f6e7a8, #c9a74a)", boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.15)" }}
        />
      )}

      <div className="min-w-0">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium opacity-90">{account.name}</p>
            {balance !== undefined && <p className={`display leading-tight ${big ? "text-4xl" : "text-2xl"}`}>{formatCOP(balance)}</p>}
            {caption && <p className="text-xs font-medium opacity-85">{caption}</p>}
          </div>
          {account.last4 && <p className="num shrink-0 text-sm font-semibold tracking-widest opacity-90">•••• {account.last4}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}
