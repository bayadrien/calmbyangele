import type { Metadata } from "next";
import "./globals.css";
import AuthListener from "@/components/AuthListener"

export const metadata: Metadata = {
  title: { default: "CALM by Angèle", template: "%s | CALM by Angèle" },
  description: "Gestion des séjours et des animaux de Comme à la Maison by Angèle.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased bg-purple text-gray-900 min-h-screen">
        <AuthListener />
        {children}
      </body>
    </html>
  );
}
