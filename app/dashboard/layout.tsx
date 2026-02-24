import Navbar from "@/components/Navbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-purple-50">
      {/* Navbar fixe */}
      <Navbar />

      {/* Contenu principal */}
      <main className="pt-24 px-6 pb-10 max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
}