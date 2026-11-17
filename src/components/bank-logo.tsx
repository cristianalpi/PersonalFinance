"use client";

import { useState } from "react";

/**
 * A bank's automatic logo. The initials stay underneath and the icon fades in
 * only once it has loaded at a usable size (some banks only publish a 16 px
 * favicon). An image that fails before the page is interactive stays hidden.
 */
export function BankLogo({ bank, fallback }: { bank: string; fallback: React.ReactNode }) {
  const [ok, setOk] = useState(false);
  const check = (img: HTMLImageElement | null) => {
    if (img?.complete && img.naturalWidth >= 32) setOk(true);
  };
  return (
    <span className="relative size-10 shrink-0">
      <span className={`absolute inset-0 transition-opacity ${ok ? "opacity-0" : ""}`}>{fallback}</span>
      {/* eslint-disable-next-line @next/next/no-img-element -- small icon served and cached by our own route */}
      <img
        ref={check}
        src={`/api/bank-logo/${bank}`}
        alt=""
        onLoad={(e) => check(e.currentTarget)}
        className={`absolute inset-0 size-10 rounded-xl bg-white object-contain p-1.5 shadow-sm transition-opacity duration-300 ${ok ? "opacity-100" : "opacity-0"}`}
      />
    </span>
  );
}
