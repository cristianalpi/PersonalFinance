import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import "@fontsource-variable/outfit";
import "@fontsource-variable/plus-jakarta-sans";
import { APP_NAME, APP_TAGLINE } from "@/lib/brand";
import { THEME_COOKIE, parseTheme } from "@/lib/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_TAGLINE,
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f2ff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0d21" },
  ],
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // The chosen theme comes in a cookie, so the first paint already has the right colours.
  const theme = parseTheme((await cookies()).get(THEME_COOKIE)?.value);
  return (
    <html lang="es-CO" className="h-full antialiased" data-theme={theme === "system" ? undefined : theme}>
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
