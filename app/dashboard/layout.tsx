"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  return (
    <div className="min-h-screen flex bg-purple-100">

      {/* Sidebar */}
      <aside className="w-64 bg-purple-700 text-white p-6 flex flex-col justify-between">

        <div>
          <h2 className="text-2xl font-bold mb-8">
            CALM 💜
          </h2>

          <nav className="space-y-4">
            <a href="/dashboard" className="block hover:bg-purple-600 p-2 rounded-lg">
              🏠 Accueil
            </a>
            <a href="/dashboard/owners" className="block hover:bg-purple-600 p-2 rounded-lg">
              👩‍🦰 Maîtres
            </a>
            <a href="/dashboard/dogs" className="block hover:bg-purple-600 p-2 rounded-lg">
              🐾 Animaux
            </a>
            <a href="/dashboard/bookings" className="block hover:bg-purple-600 p-2 rounded-lg">
              🗓 Séjours
            </a>
            <a href="/dashboard/photos" className="block hover:bg-purple-600 p-2 rounded-lg">
              📸 Photos
            </a>
          </nav>
        </div>

        <button
          onClick={() => signOut(auth)}
          className="bg-white text-purple-700 px-4 py-2 rounded-xl mt-6"
        >
          Déconnexion
        </button>
      </aside>

      {/* Contenu principal */}
      <main className="flex-1 p-10">
        <div className="bg-white rounded-3xl shadow-xl p-8 min-h-[80vh]">
          {children}
        </div>
      </main>
    </div>
  );
}