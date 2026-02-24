"use client";

import Link from "next/link";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-purple-100 to-purple-200 p-8">

      {/* HERO PREMIUM */}
      <div className="relative bg-white/70 backdrop-blur-md p-10 rounded-3xl shadow-xl border border-purple-200">
        <h1 className="text-4xl font-bold text-purple-900 mb-3">
          CALM by Angèle 🐾
        </h1>
        <p className="text-purple-800 text-lg">
          Centre de gestion professionnel & apaisé
        </p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-4 gap-6 mt-10">
        <StatCard title="Animaux actifs" value="--" />
        <StatCard title="Gardes à venir" value="--" />
        <StatCard title="Aujourd’hui" value="--" />
        <StatCard title="Ce mois" value="-- €" />
      </div>

      {/* ACCÈS RAPIDE */}
      <div className="mt-12">
        <h2 className="text-2xl font-semibold text-purple-900 mb-6">
          Accès rapide
        </h2>

        <div className="grid grid-cols-3 gap-8">
          <QuickCard
            href="/dashboard/dogs"
            title="🐾 Animaux"
            desc="Fiches & documents"
          />
          <QuickCard
            href="/dashboard/owners"
            title="👤 Maîtres"
            desc="Gestion propriétaires"
          />
          <QuickCard
            href="/dashboard/calendar"
            title="📅 Calendrier"
            desc="Planning & stats"
          />
        </div>
      </div>

    </div>
  );
}

/* ======================== */

function StatCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-md hover:shadow-xl transition border border-purple-100">
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
      className="bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-md hover:shadow-xl hover:scale-[1.02] transition border border-purple-100 block"
    >
      <h3 className="text-xl font-semibold text-purple-800 mb-3">
        {title}
      </h3>
      <p className="text-gray-600">{desc}</p>
    </Link>
  );
}