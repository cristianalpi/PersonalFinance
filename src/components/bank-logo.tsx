"use client";

import { useState } from "react";

/**
 * A bank's automatic logo. When the icon is missing or too small to look good
 * (some banks only publish a 16 px favicon), the card's initials show instead.
 */
export function BankLogo({ bank, fallback }: { bank: string; fallback: React.ReactNode }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <>{fallback}</>;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- small icon served and cached by our own route
    <img
      src={`/api/bank-logo/${bank}`}
      alt=""
      className="size-10 shrink-0 rounded-xl bg-white object-contain p-1.5 shadow-sm"
      onLoad={(e) => {
        if (e.currentTarget.naturalWidth < 32) setFailed(true);
      }}
      onError={() => setFailed(true)}
    />
  );
}
