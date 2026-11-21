// Card colours. A bank's colour is only a hint so cards are told apart at a
// glance; the user can pick another colour or upload the bank's image.

interface Bank {
  key: string;
  pattern: RegExp;
  color: string;
  /** The bank's public website, used to fetch its icon. */
  domain: string;
  /** Other sites tried in order when the first has no icon (new or renamed brands). */
  fallbacks?: string[];
  /**
   * The bank's official app in the App Store (Colombia). Its icon is the logo, and it is tried
   * first: renamed brands get a new app icon long before search engines have their new favicon.
   */
  appStoreId?: string;
}

const BANKS: Bank[] = [
  { key: "bancolombia", pattern: /bancolombia/i, color: "#FDDA24", domain: "bancolombia.com" },
  { key: "daviplata", pattern: /daviplata/i, color: "#E30613", domain: "daviplata.com" },
  // Davibank is what Scotiabank Colpatria became (2025): an account typed as Colpatria or Scotiabank is Davibank.
  // Checked before Davivienda, which is another bank with another logo.
  {
    key: "davibank",
    pattern: /davi ?bank|colpatria|scotiabank/i,
    color: "#E30613",
    domain: "davibank.com.co",
    fallbacks: ["davibank.com"],
    appStoreId: "999291025", // «DAVIbank Colombia»
  },
  { key: "davivienda", pattern: /davivienda/i, color: "#E30613", domain: "davivienda.com" },
  { key: "bbva", pattern: /bbva/i, color: "#004481", domain: "bbva.com.co" },
  { key: "bogota", pattern: /banco de bogot[aá]|bogot[aá]/i, color: "#003B71", domain: "bancodebogota.com" },
  { key: "occidente", pattern: /occidente/i, color: "#0060A9", domain: "bancodeoccidente.com.co" },
  { key: "popular", pattern: /popular/i, color: "#00843D", domain: "bancopopular.com.co" },
  { key: "avvillas", pattern: /av ?villas/i, color: "#1F4E9E", domain: "avvillas.com.co" },
  { key: "itau", pattern: /ita[uú]/i, color: "#EC7000", domain: "itau.co" },
  { key: "nu", pattern: /\bnu\b|nubank/i, color: "#820AD1", domain: "nu.com.co" },
  { key: "nequi", pattern: /nequi/i, color: "#DA0081", domain: "nequi.com.co" },
  { key: "falabella", pattern: /falabella/i, color: "#2F9E44", domain: "bancofalabella.com.co" },
  { key: "cajasocial", pattern: /caja social/i, color: "#00539F", domain: "bancocajasocial.com" },
  { key: "lulo", pattern: /lulo/i, color: "#00B894", domain: "lulobank.com" },
  // RappiPay, RappiCard and RappiCuenta share the brand.
  { key: "rappi", pattern: /rappi/i, color: "#FF441F", domain: "rappipay.co", fallbacks: ["rappi.com.co", "rappi.com"] },
  { key: "pichincha", pattern: /pichincha/i, color: "#F2C500", domain: "bancopichincha.com.co" },
  { key: "gnb", pattern: /gnb|sudameris/i, color: "#003A70", domain: "gnbsudameris.com.co" },
  { key: "agrario", pattern: /agrario/i, color: "#00753E", domain: "bancoagrario.gov.co" },
];

function findBank(institution: string | null | undefined): Bank | undefined {
  return institution ? BANKS.find((b) => b.pattern.test(institution)) : undefined;
}

/** Key of a known bank, for its automatic logo; null when the name matches none. */
export function bankKey(institution: string | null | undefined): string | null {
  return findBank(institution)?.key ?? null;
}

/** Website of a known bank by key. Only these domains are ever fetched, never one the user types. */
export function bankDomain(key: string): string | null {
  return BANKS.find((b) => b.key === key)?.domain ?? null;
}

/** The bank's website and its fallbacks, in the order to try them for an icon. */
export function bankDomains(key: string): string[] {
  const bank = BANKS.find((b) => b.key === key);
  return bank ? [bank.domain, ...(bank.fallbacks ?? [])] : [];
}

/** The App Store id of a known bank's official app, whose icon is tried first. */
export function bankAppStoreId(key: string): string | null {
  return BANKS.find((b) => b.key === key)?.appStoreId ?? null;
}

/** Colours offered in the picker when there is no bank colour, and used as defaults. */
export const CARD_COLORS = ["#6D4AFF", "#0F9488", "#E5533D", "#2563EB", "#DB2777", "#D97706", "#16A34A", "#334155"];

export function bankColor(institution: string | null | undefined): string | null {
  return findBank(institution)?.color ?? null;
}

function hash(text: string): number {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.codePointAt(0)!) >>> 0;
  return h;
}

/** The colour a card is drawn with: the user's choice, else the bank's, else one picked from its name. */
export const CASH_COLOR = "#15803D";

export function cardColor(account: { color?: string | null; institution: string | null; name: string; kind?: string }): string {
  if (account.color) return account.color;
  if (account.kind === "cash") return CASH_COLOR;
  return bankColor(account.institution) ?? CARD_COLORS[hash(account.name) % CARD_COLORS.length];
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
