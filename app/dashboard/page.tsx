"use client";

import Link from "next/link";

export default function Dashboard() {
  return (
    <div className="space-y-10">

      {/* HERO */}
      <div className="bg-gradient-to-r from-purple-200 to-purple-100 p-8 rounded-3xl shadow-md">
        <h1 className="text-3xl font-bold text-purple-900 mb-2">
          Bienvenue sur CALM 💜
        </h1>
        <p className="text-purple-800">
          Centre de gestion des gardes & animaux
        </p>
      </div>

      {/* STATS RAPIDES */}
      <div className="grid grid-cols-4 gap-6">
        <StatCard title="Animaux actifs" value="--" />
        <StatCard title="Gardes à venir" value="--" />
        <StatCard title="Aujourd’hui" value="--" />
        <StatCard title="Ce mois" value="-- €" />
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
        <p className="text-gray-600">
          Les dernières gardes et ajouts apparaîtront ici bientôt.
        </p>
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