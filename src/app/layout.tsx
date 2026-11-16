import type { Metadata, Viewport } from "next";
import "@fontsource-variable/instrument-sans";
import "@fontsource-variable/newsreader";
import "./globals.css";

export const metadata: Metadata = {
  title: "Finanzas",
  description: "Mis cuentas, tarjetas y créditos en un solo lugar.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f5f4" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1519" },
  ],
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-CO" className="h-full antialiased">
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
