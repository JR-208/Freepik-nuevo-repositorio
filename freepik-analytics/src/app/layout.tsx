import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Contributor Analytics",
  description: "Analiza tus datos de rendimiento como contribuidor de Freepik",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body className="bg-surface-0 text-text-primary antialiased">
        {children}
      </body>
    </html>
  );
}
