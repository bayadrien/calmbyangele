import type { Metadata } from "next";
import "./globals.css";
import AuthListener from "@/components/AuthListener";
import PwaRegister from "@/components/PwaRegister";

export const metadata: Metadata = {
  metadataBase: new URL("https://calmbyangele.vercel.app"),
  title: { default: "CALM by Angèle", template: "%s | CALM by Angèle" },
  description: "Conciergerie canine à Bourbourg : des gardes pensées autour du rythme, des habitudes et du bien-être de chaque compagnon.",
  applicationName: "CALM by Angèle",
  keywords: ["garde chien Bourbourg", "conciergerie canine", "pension canine", "garde animaux"],
  openGraph: { type: "website", locale: "fr_FR", siteName: "CALM by Angèle", title: "CALM by Angèle · Conciergerie canine à Bourbourg", description: "Comme à la maison, avec beaucoup d’attention." },
  twitter: { card: "summary", title: "CALM by Angèle", description: "Conciergerie canine à Bourbourg." },
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
