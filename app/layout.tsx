import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Colmena Dashboard",
  description: "Panel central de la colmena — Status de todas las apps duendes.app",
  manifest: "/manifest.json",
  themeColor: "#0a0a0a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🐝</text></svg>" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
