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
  const [tasks, setTasks] = useState<{ text: string; href: string }[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      // 🔹 Animaux
      const animalsSnap = await getDocs(collection(db, "dogs"));
      setAnimalsCount(animalsSnap.size);

      // 🔹 Bookings
      const bookingsSnap = await getDocs(collection(db, "bookings"));
      const bookingsData = bookingsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const dogNames = new Map(animalsSnap.docs.map((animal) => [animal.id, animal.data().nom || "un compagnon"]));

      setBookings(bookingsData.map((booking: any) => ({ ...booking, dogName: dogNames.get(booking.dogId) || "Un compagnon" })));

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

      const [contractsSnap, stayContractsSnap] = await Promise.all([
        getDocs(collection(db, "contracts")),
        getDocs(collection(db, "stayContracts")),
      ]);
      const nextTasks = [
        ...contractsSnap.docs.filter((item) => item.data().statut === "en_attente").map((item) => ({ text: `Le contrat initial de ${dogNames.get(item.data().dogId) || "ce compagnon"} attend une signature.`, href: "/dashboard/dogs" })),
        ...stayContractsSnap.docs.filter((item) => item.data().statut === "en_attente").map((item) => ({ text: `Un contrat de séjour pour ${dogNames.get(item.data().dogId) || "un compagnon"} attend une signature.`, href: "/dashboard/bookings" })),
        ...bookingsData.filter((item: any) => new Date(item.dateDebut) > today && new Date(item.dateDebut).getTime() - today.getTime() < 1000 * 60 * 60 * 24 * 3).map((item: any) => ({ text: `Préparer l’arrivée de ${dogNames.get(item.dogId) || "ce compagnon"} le ${item.dateDebut}.`, href: "/dashboard/bookings" })),
      ];
      setTasks(nextTasks.slice(0, 5));
    };

    fetchData();
  }, []);


  return (
    <div className="space-y-9">
      <section className="relative overflow-hidden rounded-[2rem] bg-[#315e4e] px-7 py-9 text-white shadow-xl shadow-[#315e4e]/15 sm:px-10 sm:py-11">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full border-[30px] border-white/10" /><div className="absolute -bottom-24 right-32 h-44 w-44 rounded-full bg-[#f0b895] opacity-90" />
        <div className="relative max-w-xl"><p className="text-xs font-bold uppercase tracking-[.2em] text-[#c7ded0]">Le carnet de la maison</p><h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Bonjour, Angèle.</h1><p className="mt-3 max-w-md text-sm leading-6 text-white/75">Tout ce qu’il faut pour suivre les compagnons confiés à votre attention, d’un seul regard.</p></div>
      </section>

      {/* STATS RAPIDES */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5">
        <StatCard title="Animaux actifs" value={animalsCount.toString()} icon="◌" />
        <StatCard title="Séjours à venir" value={bookings.filter(b => new Date(b.dateDebut) > new Date()).length.toString()} icon="□" />
        <StatCard title="À la maison" value={todayCount.toString()} icon="♥" />
        <StatCard title="Ce mois" value={`${revenueMonth} €`} icon="↗" />
      </div>

      <section className="today-board"><div><p className="eyebrow">À ne pas oublier</p><h2>Le fil de votre journée</h2></div><div className="today-list">{tasks.length ? tasks.map((task, index) => <Link key={`${task.text}-${index}`} href={task.href}><span>{index + 1}</span>{task.text}<b>→</b></Link>) : <p><span>✓</span>Tout est prêt pour aujourd’hui.</p>}</div></section>

      {/* RACCOURCIS */}
      <div>
        <div className="mb-4 flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#77867d]">Organisation</p><h2 className="mt-1 text-2xl font-bold tracking-tight text-[#1d3029]">Accès rapide</h2></div><p className="hidden text-sm text-[#718078] sm:block">Les essentiels de la journée</p></div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-5">
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
      <section className="rounded-[1.6rem] border border-[#e0e5dc] bg-white/75 p-6 shadow-sm sm:p-7">
        <h2 className="text-xl font-bold tracking-tight text-[#1d3029]">Derniers séjours</h2><p className="mt-1 text-sm text-[#728078]">L’activité la plus récente de la maison.</p>
        <div className="mt-5 divide-y divide-[#e7ebe3]">
          {bookings.slice(-5).reverse().map((b, index) => (<p key={index} className="py-3 text-sm text-[#42564c]"><span className="mr-3 inline-grid h-7 w-7 place-items-center rounded-full bg-[#e2eee6] text-[#315e4e]">◌</span><strong>{b.dogName}</strong> · du <strong>{b.dateDebut}</strong> au <strong>{b.dateFin}</strong></p>))}
          {!bookings.length && <p className="py-5 text-sm text-[#718078]">Aucun séjour enregistré pour le moment.</p>}
        </div>
      </section>

    </div>
  );
}

/* =========================
   COMPONENTS
========================= */

function StatCard({
  title,
  value, icon,
}: {
  title: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="rounded-[1.35rem] border border-[#e1e6dd] bg-white/80 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5">
      <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#e2eee6] text-sm text-[#315e4e]">{icon}</span><p className="mt-4 text-xs font-semibold text-[#75837b]">{title}</p><p className="mt-1 text-2xl font-bold tracking-tight text-[#1d3029]">{value}</p>
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
      className="group block rounded-[1.35rem] border border-[#e1e6dd] bg-white/75 p-5 shadow-sm transition hover:-translate-y-1 hover:border-[#bfd4c6] hover:shadow-lg"
    >
      <h3 className="text-lg font-bold tracking-tight text-[#254c3e] mb-2 group-hover:text-[#396957]">
        {title}
      </h3>
      <p className="text-[#718078] text-sm">{desc}</p><span className="mt-5 inline-block text-sm font-bold text-[#396957] transition group-hover:translate-x-1">Ouvrir →</span>
    </Link>
  );
}
