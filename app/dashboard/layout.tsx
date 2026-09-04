import Navbar from "@/components/Navbar";
import MobileNav from "@/components/MobileNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      {/* Navbar fixe */}
      <Navbar />

      {/* Contenu principal */}
      <main className="mx-auto max-w-7xl px-5 pb-28 pt-24 sm:px-8 sm:pb-12 sm:pt-32">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
