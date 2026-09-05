"use client";

import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

/* =========================
   TYPES
========================= */

type Booking = {
  id: string;
  dogId: string;
  dateDebut: string;
  dateFin: string;
  nombreNuits?: number;
  prix?: number;
};

type Dog = {
  id: string;
  nom: string;
  dateNaissance?: string;
};

type Unavailability = {
  id: string;
  startDate: string;
  endDate: string;
};

type Stats = {
  todayAnimals: number;
  monthBookings: number;
  monthNights: number;
  monthRevenue: number;
  nextBirthday: string;
};

/* =========================
   PAGE
========================= */

export default function CalendarPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [stats, setStats] = useState<Stats>({
    todayAnimals: 0,
    monthBookings: 0,
    monthNights: 0,
    monthRevenue: 0,
    nextBirthday: "Aucun",
  });

  const [unavailabilities, setUnavailabilities] = useState<
    Unavailability[]
  >([]);
  const [showUnavailabilityForm, setShowUnavailabilityForm] = useState(false);
  const [unavailabilityDates, setUnavailabilityDates] = useState({ start: "", end: "" });

  useEffect(() => {
    fetchData();
  }, []);

  /* =========================
     FETCH DATA
  ========================= */

  const fetchData = async () => {
    const bookingsSnap = await getDocs(collection(db, "bookings"));
    const dogsSnap = await getDocs(collection(db, "dogs"));
    const unavailSnap = await getDocs(
      collection(db, "unavailabilities")
    );

    const bookings: Booking[] = bookingsSnap.docs.map((docSnap) => {
      const data = docSnap.data() as Booking;
      return { ...data, id: docSnap.id };
    });

    const dogs: Dog[] = dogsSnap.docs.map((docSnap) => {
      const data = docSnap.data() as Dog;
      return { ...data, id: docSnap.id };
    });

    const unavail: Unavailability[] = unavailSnap.docs.map(
      (docSnap) => {
        const data = docSnap.data() as Unavailability;
        return { ...data, id: docSnap.id };
      }
    );

    setUnavailabilities(unavail);

    const calendarEvents: any[] = [];

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    let todayAnimals = 0;
    let monthBookings = 0;
    let monthNights = 0;
    let monthRevenue = 0;

    /* =========================
       🐾 GARDES
    ========================= */

    for (const booking of bookings) {
      const dog = dogs.find((d) => d.id === booking.dogId);
      const dogName = dog ? dog.nom : "Animal";

      calendarEvents.push({
        title: `🐾 ${dogName}`,
        start: booking.dateDebut,
        end: booking.dateFin,
        color: "#a78bfa",
      });

      const start = new Date(booking.dateDebut);
      const end = new Date(booking.dateFin);

      if (today >= start && today <= end) {
        todayAnimals++;
      }

      if (
        start.getMonth() === currentMonth &&
        start.getFullYear() === currentYear
      ) {
        monthBookings++;
        monthNights += Number(booking.nombreNuits || 0);
        monthRevenue += Number(booking.prix || 0);
      }
    }

    /* =========================
       🎂 ANNIVERSAIRES
    ========================= */

    let nextBirthdayDate: Date | null = null;
    let nextBirthdayName = "";

    for (const dog of dogs) {
      if (!dog.dateNaissance) continue;

      const birth = new Date(dog.dateNaissance);
      const birthdayThisYear = new Date(
        currentYear,
        birth.getMonth(),
        birth.getDate()
      );

      calendarEvents.push({
        title: `🎂 ${dog.nom}`,
        start: birthdayThisYear,
        allDay: true,
        color: "#f472b6",
      });

      if (
        birthdayThisYear >= today &&
        (nextBirthdayDate === null ||
          birthdayThisYear < nextBirthdayDate)
      ) {
        nextBirthdayDate = birthdayThisYear;
        nextBirthdayName = dog.nom;
      }
    }

    /* =========================
       🚫 INDISPONIBILITÉS
    ========================= */

    for (const u of unavail) {
      calendarEvents.push({
        title: "🚫 Indisponible",
        start: u.startDate,
        end: u.endDate,
        color: "#ef4444",
      });
    }

    const nextBirthdayText =
      nextBirthdayDate !== null
        ? `${nextBirthdayName} (${nextBirthdayDate.toLocaleDateString()})`
        : "Aucun";

    setEvents(calendarEvents);

    setStats({
      todayAnimals,
      monthBookings,
      monthNights,
      monthRevenue,
      nextBirthday: nextBirthdayText,
    });
  };

  /* =========================
     AJOUT INDISPO
  ========================= */

  const addUnavailability = async () => {
    const { start, end } = unavailabilityDates;
    if (!start || !end || new Date(end) < new Date(start)) return;

    await addDoc(collection(db, "unavailabilities"), {
      startDate: start,
      endDate: end,
      createdAt: new Date(),
    });

    setUnavailabilityDates({ start: "", end: "" });
    setShowUnavailabilityForm(false);
    fetchData();
  };

  const deleteUnavailability = async (id: string) => {
    await deleteDoc(doc(db, "unavailabilities", id));
    fetchData();
  };

  /* =========================
     RENDER
  ========================= */

  return (
    <div className="space-y-8">
      <header className="page-intro"><div><p className="eyebrow">Le calendrier</p><h1>Visualisez les jours qui viennent.</h1><p>Un planning clair pour préparer chaque arrivée et préserver vos temps de repos.</p></div></header>

      {/* STATS */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatCard
          title="Aujourd’hui"
          value={`${stats.todayAnimals} animaux`}
        />
        <StatCard
          title="Gardes ce mois"
          value={stats.monthBookings}
        />
        <StatCard
          title="Nuits ce mois"
          value={stats.monthNights}
        />
        <StatCard
          title="Chiffre ce mois"
          value={`${stats.monthRevenue} €`}
        />
        <StatCard
          title="Prochain anniversaire"
          value={stats.nextBirthday}
        />
      </div>

      {/* BOUTON INDISPO */}
      <section className="rounded-2xl border border-[#edc8bd] bg-[#fff8f5] p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="eyebrow text-[#a95537]">Votre rythme</p><h2 className="mt-1 text-lg font-bold text-[#763c2a]">Prévoir une indisponibilité</h2></div><button onClick={() => setShowUnavailabilityForm((open) => !open)} className="rounded-xl border border-[#edc8bd] bg-white px-4 py-3 text-sm font-bold text-[#a95537]">{showUnavailabilityForm ? "Fermer" : "Ajouter une période"}</button></div>{showUnavailabilityForm && <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]"><input aria-label="Début de l’indisponibilité" type="date" value={unavailabilityDates.start} onChange={(event) => setUnavailabilityDates({ ...unavailabilityDates, start: event.target.value })} className="calm-control" /><input aria-label="Fin de l’indisponibilité" type="date" value={unavailabilityDates.end} min={unavailabilityDates.start} onChange={(event) => setUnavailabilityDates({ ...unavailabilityDates, end: event.target.value })} className="calm-control" /><button onClick={addUnavailability} disabled={!unavailabilityDates.start || !unavailabilityDates.end} className="calm-primary disabled:opacity-50">Enregistrer</button></div>}</section>

      {/* LISTE INDISPOS */}
      {unavailabilities.length > 0 && (
        <div className="rounded-2xl border border-[#f1d8d0] bg-[#fff8f5] p-5">
          <h3 className="font-semibold text-[#763c2a] mb-3">Vos indisponibilités</h3>
          {unavailabilities.map((u) => (
            <div
              key={u.id}
              className="mb-2 flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm"
            >
              <span>
                {u.startDate} → {u.endDate}
              </span>
              <button
                onClick={() => deleteUnavailability(u.id)}
                className="font-semibold text-[#a95537]"
              >
                Supprimer
              </button>
            </div>
          ))}
        </div>
      )}

      {/* CALENDRIER */}
      <div className="calm-panel p-4 sm:p-7">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={events}
          height="auto"
        />
      </div>
    </div>
  );
}

/* =========================
   STAT CARD
========================= */

function StatCard({
  title,
  value,
}: {
  title: string;
  value: any;
}) {
  return (
    <div className="metric-card">
      <p>{title}</p><p>{value}</p>
    </div>
  );
}
