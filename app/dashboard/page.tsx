"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
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
      <p className="text-purple-700">Chargement...</p>
    );
  }

  return (
    <>
      <h1 className="text-3xl font-bold text-purple-900 mb-10">
        Tableau de bord
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <a
          href="/dashboard/owners"
          className="bg-purple-50 hover:bg-purple-100 p-6 rounded-2xl shadow transition"
        >
          <h2 className="text-xl font-semibold text-purple-900 mb-2">
            👩‍🦰 Maîtres
          </h2>
          <p className="text-gray-700">
            Gestion des propriétaires
          </p>
        </a>

        <a
          href="/dashboard/dogs"
          className="bg-purple-50 hover:bg-purple-100 p-6 rounded-2xl shadow transition"
        >
          <h2 className="text-xl font-semibold text-purple-900 mb-2">
            🐾 Animaux
          </h2>
          <p className="text-gray-700">
            Gestion des fiches chiens
          </p>
        </a>

        <a
          href="/dashboard/bookings"
          className="bg-purple-50 hover:bg-purple-100 p-6 rounded-2xl shadow transition"
        >
          <h2 className="text-xl font-semibold text-purple-900 mb-2">
            🗓 Séjours
          </h2>
          <p className="text-gray-700">
            Historique des gardes
          </p>
        </a>

        <a
          href="/dashboard/photos"
          className="bg-purple-50 hover:bg-purple-100 p-6 rounded-2xl shadow transition"
        >
          <h2 className="text-xl font-semibold text-purple-900 mb-2">
            📸 Photos
          </h2>
          <p className="text-gray-700">
            Galerie des souvenirs
          </p>
        </a>

      </div>
    </>
  );
}