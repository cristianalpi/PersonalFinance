"use client";

import { useState } from "react";

/**
 * The colour along the sides of an icon that fills its own square (an app icon, a favicon on a
 * coloured tile), or null for a logo drawn on transparency. Sampled at the middle of each side,
 * just inside, so rounded corners do not count.
 */
function edgeColor(img: HTMLImageElement): string | null {
  const n = 24;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = n;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, n, n);
  const sides = [
    [n / 2, 1],
    [1, n / 2],
    [n - 2, n / 2],
    [n / 2, n - 2],
  ].map(([x, y]) => ctx.getImageData(x, y, 1, 1).data);
  if (sides.some((p) => p[3] < 230)) return null;
  // Sides of clearly different colours are a picture, not a background.
  const spread = Math.max(...[0, 1, 2].map((c) => Math.max(...sides.map((p) => p[c])) - Math.min(...sides.map((p) => p[c]))));
  if (spread > 40) return null;
  const avg = (c: number) => Math.round(sides.reduce((sum, p) => sum + p[c], 0) / sides.length);
  return `rgb(${avg(0)} ${avg(1)} ${avg(2)})`;
}

/**
 * A bank's logo on the card: the automatic one (`/api/bank-logo/…`) or an image the person
 * uploaded. The initials stay underneath until the image has loaded at a usable size (some banks
 * only publish a 16 px favicon). An icon with its own background fills the tile edge to edge, in
 * that colour; a transparent logo sits on white so it reads on any card.
 */
export function BankLogo({ src, fallback }: { src: string; fallback: React.ReactNode }) {
  const [ok, setOk] = useState(false);
  const [bleed, setBleed] = useState<string | null>(null);
  const check = (img: HTMLImageElement | null) => {
    // The 32 px floor is for automatic favicons; an uploaded image always shows.
    if (!img?.complete || img.naturalWidth < (src.startsWith("data:") ? 1 : 32) || ok) return;
    try {
      setBleed(edgeColor(img));
    } catch {
      // A canvas that cannot be read keeps the white tile.
    }
    setOk(true);
  };
  return (
    <span className="relative size-10 shrink-0">
      <span className={`absolute inset-0 transition-opacity ${ok ? "opacity-0" : ""}`}>{fallback}</span>
      {/* eslint-disable-next-line @next/next/no-img-element -- small icon served and cached by our own route, or a data URL */}
      <img
        ref={check}
        src={src}
        alt=""
        onLoad={(e) => check(e.currentTarget)}
        style={bleed ? { background: bleed } : undefined}
        className={`absolute inset-0 size-10 overflow-hidden rounded-xl shadow-sm transition-opacity duration-300 ${bleed ? "object-cover" : "bg-white object-contain p-1.5"} ${ok ? "opacity-100" : "opacity-0"}`}
      />
    </span>
  );
}
