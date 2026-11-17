// Card colours. A bank's colour is only a hint so cards are told apart at a
// glance; the user can pick another colour or upload the bank's image.

const BANK_COLORS: [RegExp, string][] = [
  [/bancolombia/i, "#FDDA24"],
  [/davivienda|daviplata/i, "#E30613"],
  [/bbva/i, "#004481"],
  [/banco de bogot[aá]|bogot[aá]/i, "#003B71"],
  [/occidente/i, "#0060A9"],
  [/popular/i, "#00843D"],
  [/av ?villas/i, "#1F4E9E"],
  [/colpatria|scotiabank/i, "#EC111A"],
  [/ita[uú]/i, "#EC7000"],
  [/\bnu\b|nubank/i, "#820AD1"],
  [/nequi/i, "#DA0081"],
  [/falabella/i, "#2F9E44"],
  [/caja social/i, "#00539F"],
  [/lulo/i, "#00B894"],
  [/rappi/i, "#FF441F"],
  [/pichincha/i, "#F2C500"],
  [/gnb|sudameris/i, "#003A70"],
  [/agrario/i, "#00753E"],
];

/** Colours offered in the picker when there is no bank colour, and used as defaults. */
export const CARD_COLORS = ["#6D4AFF", "#0F9488", "#E5533D", "#2563EB", "#DB2777", "#D97706", "#16A34A", "#334155"];

export function bankColor(institution: string | null | undefined): string | null {
  if (!institution) return null;
  return BANK_COLORS.find(([pattern]) => pattern.test(institution))?.[1] ?? null;
}

function hash(text: string): number {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.codePointAt(0)!) >>> 0;
  return h;
}

/** The colour a card is drawn with: the user's choice, else the bank's, else one picked from its name. */
export function cardColor(account: { color?: string | null; institution: string | null; name: string }): string {
  return account.color ?? bankColor(account.institution) ?? CARD_COLORS[hash(account.name) % CARD_COLORS.length];
}

function channel(c: number): number {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Mixes a colour toward black (amount 0–1) for the far end of the card's gradient. */
export function shade(hex: string, amount: number): string {
  const out = [1, 3, 5].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * (1 - amount)));
  return `#${out.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

export const CARD_INK_DARK = "#14112E";

/** Text colour for a card: whichever of white or near-black reads better on its darkest point. */
export function cardInk(hex: string): string {
  const darkest = shade(hex, 0.28);
  return contrast("#FFFFFF", darkest) >= contrast(CARD_INK_DARK, hex) ? "#FFFFFF" : CARD_INK_DARK;
}

export function initials(text: string): string {
  const words = text.trim().split(/\s+/).filter((w) => !/^(de|del|la|el|banco)$/i.test(w));
  return (words.length ? words : [text]).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}
