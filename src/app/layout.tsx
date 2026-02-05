import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Casa94 Stone - Simulador de Taxas",
  description: "Compare taxas de maquininhas e gere relatórios em PDF/Excel",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="bg-slate-900 text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}
