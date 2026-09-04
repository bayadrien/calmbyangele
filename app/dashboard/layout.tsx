import Navbar from "@/components/Navbar";

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
      <main className="mx-auto max-w-7xl px-5 pb-12 pt-28 sm:px-8 sm:pt-32">
        {children}
      </main>
    </div>
  );
}
