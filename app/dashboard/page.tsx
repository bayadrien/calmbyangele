"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login");
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-purple-100">
        <p className="text-purple-700">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-purple-100 p-8">
      <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-xl p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-purple-700">
            Dashboard CALM
          </h1>
          <button
            onClick={() => signOut(auth)}
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-xl transition"
          >
            Déconnexion
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-purple-50 p-6 rounded-2xl shadow">
            <h2 className="text-xl font-semibold text-purple-700 mb-2">
              Maîtres
            </h2>
            <p className="text-gray-600">Gestion des propriétaires</p>
          </div>

          <div className="bg-purple-50 p-6 rounded-2xl shadow">
            <h2 className="text-xl font-semibold text-purple-700 mb-2">
              Chiens
            </h2>
            <p className="text-gray-600">Gestion des fiches chiens</p>
          </div>

          <div className="bg-purple-50 p-6 rounded-2xl shadow">
            <h2 className="text-xl font-semibold text-purple-700 mb-2">
              Séjours
            </h2>
            <p className="text-gray-600">Historique des gardes</p>
          </div>

          <div className="bg-purple-50 p-6 rounded-2xl shadow">
            <h2 className="text-xl font-semibold text-purple-700 mb-2">
              Documents
            </h2>
            <p className="text-gray-600">Fichiers privés</p>
          </div>
        </div>
      </div>
    </div>
  );
}