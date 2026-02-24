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
    const start = prompt("Date début (YYYY-MM-DD)");
    const end = prompt("Date fin (YYYY-MM-DD)");

    if (!start || !end) return;

    await addDoc(collection(db, "unavailabilities"), {
      startDate: start,
      endDate: end,
      createdAt: new Date(),
    });

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

      {/* STATS */}
      <div className="grid grid-cols-5 gap-4">
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
      <button
        onClick={addUnavailability}
        className="bg-red-500 text-white px-4 py-2 rounded-xl"
      >
        Ajouter indisponibilité
      </button>

      {/* LISTE INDISPOS */}
      {unavailabilities.length > 0 && (
        <div className="bg-red-50 p-4 rounded-xl">
          <h3 className="font-semibold mb-3">
            Indisponibilités enregistrées
          </h3>
          {unavailabilities.map((u) => (
            <div
              key={u.id}
              className="flex justify-between mb-2"
            >
              <span>
                {u.startDate} → {u.endDate}
              </span>
              <button
                onClick={() => deleteUnavailability(u.id)}
                className="text-red-600"
              >
                Supprimer
              </button>
            </div>
          ))}
        </div>
      )}

      {/* CALENDRIER */}
      <div className="bg-white p-6 rounded-2xl shadow">
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
    <div className="bg-purple-100 p-4 rounded-xl">
      <p className="text-sm text-gray-700">{title}</p>
      <p className="text-xl font-bold text-black">{value}</p>
    </div>
  );
}