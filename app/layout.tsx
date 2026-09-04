import type { Metadata } from "next";
import "./globals.css";
import AuthListener from "@/components/AuthListener";
import PwaRegister from "@/components/PwaRegister";

export const metadata: Metadata = {
  title: { default: "CALM by Angèle", template: "%s | CALM by Angèle" },
  description: "La conciergerie canine d’Angèle, toujours à portée de main.",
  applicationName: "CALM by Angèle",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "CALM" },
  formatDetection: { telephone: false },
};

export const viewport = { width: "device-width", initialScale: 1, themeColor: "#315e4e" };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased bg-purple text-gray-900 min-h-screen">
        <AuthListener />
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
