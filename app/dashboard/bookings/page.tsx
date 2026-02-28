"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

export default function BookingsPage() {
  const [dogs, setDogs] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);

  const [form, setForm] = useState({
    dogId: "",
    dateDebut: "",
    dateFin: "",
    prix: "",
    notesPubliques: "",
    modalite: "",
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDates, setEditDates] = useState({
    dateDebut: "",
    dateFin: "",
  });

  // 🔹 Fetch dogs
  const fetchDogs = async () => {
    const snapshot = await getDocs(collection(db, "dogs"));
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setDogs(data);
  };

  // 🔹 Fetch bookings
  const fetchBookings = async () => {
    const snapshot = await getDocs(collection(db, "bookings"));
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setBookings(data);
  };

  useEffect(() => {
    fetchDogs();
    fetchBookings();
  }, []);

  const calculateNights = (start: string, end: string) => {
    const d1 = new Date(start);
    const d2 = new Date(end);
    const diff = d2.getTime() - d1.getTime();
    return Math.ceil(diff / (1000 * 3600 * 24));
  };

  // 🔹 CREATE BOOKING
  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!form.dogId || !form.dateDebut || !form.dateFin) {
      alert("Veuillez remplir les champs obligatoires.");
      return;
    }

    const nights = calculateNights(form.dateDebut, form.dateFin);

    const bookingRef = await addDoc(collection(db, "bookings"), {
      ...form,
      nombreNuits: nights,
      stayContractStatut: "en_attente",
      createdAt: new Date(),
    });

    const dogSnap = await getDoc(doc(db, "dogs", form.dogId));
    const dogData = dogSnap.data();

    if (!dogData?.ownerId) {
      alert("Owner introuvable.");
      return;
    }

    const token = uuidv4();

    const stayContractRef = await addDoc(collection(db, "stayContracts"), {
      dogId: form.dogId,
      ownerId: dogData.ownerId,
      bookingId: bookingRef.id,
      dateDebut: form.dateDebut,
      dateFin: form.dateFin,
      statut: "en_attente",
      token,
      modalite: form.modalite,
      prix: form.prix,
    });

    const link = `${window.location.origin}/contrat-sejour/${token}`;

    await updateDoc(bookingRef, {
      stayContractId: stayContractRef.id,
      stayContractLink: link,
    });

    setForm({
      dogId: "",
      dateDebut: "",
      dateFin: "",
      prix: "",
      notesPubliques: "",
      modalite: "",
    });

    fetchBookings();
  };

  // 🔹 UPDATE DATES
  const handleUpdateDates = async (booking: any) => {
    if (!editDates.dateDebut || !editDates.dateFin) {
      alert("Dates invalides");
      return;
    }

    if (new Date(editDates.dateFin) <= new Date(editDates.dateDebut)) {
      alert("La date de fin doit être après la date de début");
      return;
    }

    const nights = calculateNights(editDates.dateDebut, editDates.dateFin);

    await updateDoc(doc(db, "bookings", booking.id), {
      dateDebut: editDates.dateDebut,
      dateFin: editDates.dateFin,
      nombreNuits: nights,
    });

    if (booking.stayContractId) {
      await updateDoc(doc(db, "stayContracts", booking.stayContractId), {
        dateDebut: editDates.dateDebut,
        dateFin: editDates.dateFin,
      });
    }

    setEditingId(null);
    fetchBookings();
  };

  return (
    <div className="min-h-screen bg-purple-100 p-8">
      <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-xl p-8">
        <h1 className="text-2xl font-bold text-purple-900 mb-6">
          Gestion des Séjours
        </h1>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 mb-8">
          <select
            value={form.dogId}
            onChange={(e) =>
              setForm({ ...form, dogId: e.target.value })
            }
            className="border border-purple-300 p-2 rounded-lg"
          >
            <option value="">Sélectionner un chien</option>
            {dogs.map((dog) => (
              <option key={dog.id} value={dog.id}>
                {dog.nom}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={form.dateDebut}
            onChange={(e) =>
              setForm({ ...form, dateDebut: e.target.value })
            }
            className="border border-purple-300 p-2 rounded-lg"
          />

          <input
            type="date"
            value={form.dateFin}
            onChange={(e) =>
              setForm({ ...form, dateFin: e.target.value })
            }
            className="border border-purple-300 p-2 rounded-lg"
          />

          <input
            placeholder="Prix"
            value={form.prix}
            onChange={(e) =>
              setForm({ ...form, prix: e.target.value })
            }
            className="border border-purple-300 p-2 rounded-lg"
          />

          <textarea
            placeholder="Notes publiques"
            value={form.notesPubliques}
            onChange={(e) =>
              setForm({ ...form, notesPubliques: e.target.value })
            }
            className="col-span-2 border border-purple-300 p-2 rounded-lg"
          />

          <button
            type="submit"
            className="col-span-2 bg-purple-500 text-white p-3 rounded-xl"
          >
            Ajouter le séjour
          </button>
        </form>

        {/* BOOKINGS LIST */}
          {bookings.map((booking) => {
            const dog = dogs.find((d) => d.id === booking.dogId);

            return (
              <div
                key={booking.id}
                className="bg-purple-100 p-4 rounded-xl mb-3 shadow-md"
              >
                <p className="font-semibold text-purple-900">
                  {dog?.nom || "Chien inconnu"}
                </p>

                {editingId === booking.id ? (
                  <div className="space-y-2 mt-2">
                    <input
                      type="date"
                      value={editDates.dateDebut}
                      onChange={(e) =>
                        setEditDates({
                          ...editDates,
                          dateDebut: e.target.value,
                        })
                      }
                      className="border p-2 rounded-lg"
                    />

                    <input
                      type="date"
                      value={editDates.dateFin}
                      onChange={(e) =>
                        setEditDates({
                          ...editDates,
                          dateFin: e.target.value,
                        })
                      }
                      className="border p-2 rounded-lg"
                    />

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateDates(booking)}
                        className="bg-purple-600 text-white px-3 py-1 rounded-lg"
                      >
                        Enregistrer
                      </button>

                      <button
                        onClick={() => setEditingId(null)}
                        className="text-gray-500"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p>
                      {booking.dateDebut} → {booking.dateFin}
                    </p>
                    <p>{booking.nombreNuits} nuits</p>

                    <div className="flex justify-between items-center mt-3">
                      {/* Lien contrat si en attente */}
                      {booking.stayContractStatut === "en_attente" &&
                        booking.stayContractLink && (
                          <a
                            href={booking.stayContractLink}
                            target="_blank"
                            className="text-purple-700 underline"
                          >
                            Voir contrat complémentaire
                          </a>
                        )}

                      {/* Badge en attente */}
                      {booking.stayContractStatut === "en_attente" && (
                        <span className="bg-orange-100 text-orange-700 text-xs px-3 py-1 rounded-full font-medium">
                          ⏳ En attente
                        </span>
                      )}

                      {/* Badge signé */}
                      {booking.stayContractStatut === "signé" && (
                        <span className="ml-auto bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-medium">
                          ✅ Contrat signé
                        </span>
                      )}
                    </div>

                    {/* Bouton modifier uniquement si pas signé */}
                    {booking.stayContractStatut !== "signé" && (
                      <button
                        onClick={() => {
                          setEditingId(booking.id);
                          setEditDates({
                            dateDebut: booking.dateDebut,
                            dateFin: booking.dateFin,
                          });
                        }}
                        className="text-purple-700 underline text-sm mt-2"
                      >
                        Modifier les dates
                      </button>
                    )}
                  </>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}