"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export default function Dashboard() {
  const [animalsCount, setAnimalsCount] = useState(0);
  const [bookings, setBookings] = useState<any[]>([]);
  const [revenueMonth, setRevenueMonth] = useState(0);
  const [todayCount, setTodayCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      // 🔹 Animaux
      const animalsSnap = await getDocs(collection(db, "dogs"));
      setAnimalsCount(animalsSnap.size);

      // 🔹 Bookings
      const bookingsSnap = await getDocs(collection(db, "bookings"));
      const bookingsData = bookingsSnap.docs.map(doc => doc.data());

      setBookings(bookingsData);

      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();

      let totalMonth = 0;
      let todayBookings = 0;
      let upcoming = 0;

      bookingsData.forEach((b: any) => {
        const start = new Date(b.dateDebut);
        const end = new Date(b.dateFin);

        // CA du mois
        if (
          start.getMonth() === currentMonth &&
          start.getFullYear() === currentYear
        ) {
          totalMonth += Number(b.prix || 0);
        }

        // Aujourd’hui
        if (
          today >= start &&
          today <= end
        ) {
          todayBookings++;
        }

        // À venir
        if (start > today) {
          upcoming++;
        }
      });

      setRevenueMonth(totalMonth);
      setTodayCount(todayBookings);
    };

    fetchData();
  }, []);


  return (
    <div className="space-y-10">

      {/* HERO */}
      <div className="bg-gradient-to-r from-purple-200 to-purple-100 p-8 rounded-3xl shadow-md">
        <h1 className="text-3xl font-bold text-purple-900 mb-2">
          Bienvenue sur Comme A La Maison by Angèle 💜
        </h1>
        <p className="text-purple-800">
          Centre de gestion des gardes & animaux
        </p>
      </div>

      {/* STATS RAPIDES */}
      <div className="grid grid-cols-4 gap-6">
        <StatCard title="Animaux actifs" value={animalsCount.toString()} />
        <StatCard title="Gardes à venir" value={bookings.filter(b => new Date(b.dateDebut) > new Date()).length.toString()} />
        <StatCard title="Aujourd’hui" value={todayCount.toString()} />
        <StatCard title="Ce mois" value={`${revenueMonth} €`} />
      </div>

      {/* RACCOURCIS */}
      <div>
        <h2 className="text-xl font-semibold text-purple-900 mb-4">
          Accès rapide
        </h2>

        <div className="grid grid-cols-3 gap-6">
          <QuickCard
            href="/dashboard/dogs"
            title="🐾 Animaux"
            desc="Fiches complètes & documents"
          />
          <QuickCard
            href="/dashboard/owners"
            title="👤 Maîtres"
            desc="Gestion des propriétaires"
          />
          <QuickCard
            href="/dashboard/bookings"
            title="🏡 Séjours"
            desc="Gestion des gardes"
          />
          <QuickCard
            href="/dashboard/photos"
            title="📸 Photos"
            desc="Galerie & souvenirs"
          />
          <QuickCard
            href="/dashboard/calendar"
            title="📅 Calendrier"
            desc="Planning & statistiques"
          />

        </div>
      </div>

      {/* ACTIVITÉ RÉCENTE */}
      <div className="bg-white p-6 rounded-2xl shadow">
        <h2 className="text-xl font-semibold mb-4 text-purple-900">
          Activité récente
        </h2>
        <div className="bg-white/80 p-6 rounded-2xl shadow border border-purple-100">
          {bookings.slice(-5).reverse().map((b, index) => (
            <p key={index} className="text-gray-700 mb-2">
              🐾 Séjour du {b.dateDebut} au {b.dateFin}
            </p>
          ))}
        </div>
      </div>

    </div>
  );
}

/* =========================
   COMPONENTS
========================= */

function StatCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow hover:shadow-lg transition">
      <p className="text-sm text-gray-600">{title}</p>
      <p className="text-2xl font-bold text-purple-800 mt-2">
        {value}
      </p>
    </div>
  );
}

function QuickCard({
  href,
  title,
  desc,
}: {
  href: string;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="bg-purple-50 p-6 rounded-2xl shadow hover:shadow-lg hover:bg-purple-100 transition block"
    >
      <h3 className="text-lg font-semibold text-purple-800 mb-2">
        {title}
      </h3>
      <p className="text-gray-600 text-sm">{desc}</p>
    </Link>
  );
}