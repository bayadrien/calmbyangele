"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc
} from "firebase/firestore";
import Navbar from "@/components/Navbar";
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

  const fetchDogs = async () => {
    const snapshot = await getDocs(collection(db, "dogs"));
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setDogs(data);
  };

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

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!form.dogId || !form.dateDebut || !form.dateFin) {
      alert("Veuillez remplir les champs obligatoires.");
      return;
    }

    const nights = calculateNights(form.dateDebut, form.dateFin);

    // 🔹 1. Création du booking (UNE SEULE FOIS)
    const bookingRef = await addDoc(collection(db, "bookings"), {
      ...form,
      nombreNuits: nights,
      stayContractStatut: "en_attente",
      createdAt: new Date(),
    });

    // 🔹 2. Récupérer le chien
    const dogSnap = await getDoc(doc(db, "dogs", form.dogId));
    const dogData = dogSnap.data();

    if (!dogData?.ownerId) {
      alert("Owner introuvable pour ce chien.");
      return;
    }

    // 🔹 3. Token
    const token = uuidv4();

    // 🔹 4. Créer stayContract
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

    // 🔹 5. Générer lien
    const link = `${window.location.origin}/contrat-sejour/${token}`;

    // 🔹 6. Mettre à jour le booking existant
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

  
  return (
    
    <div className="min-h-screen bg-purple-100 p-8">
      <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-xl p-8">
        <h1 className="text-2xl font-bold text-purple-900 mb-6">
          Gestion des Séjours
        </h1>

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 mb-8">

          <select
            value={form.dogId}
            onChange={(e) =>
              setForm({ ...form, dogId: e.target.value })
            }
            className="border border-purple-300 bg-white p-2 rounded-lg text-gray-900"
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
            className="border border-purple-300 bg-white p-2 rounded-lg text-gray-900"
          />

          <input
            type="date"
            value={form.dateFin}
            onChange={(e) =>
              setForm({ ...form, dateFin: e.target.value })
            }
            className="border border-purple-300 bg-white p-2 rounded-lg text-gray-900"
          />

          <select
            value={form.modalite}
            onChange={(e) =>
              setForm({ ...form, modalite: e.target.value })
            }
            className="border border-purple-300 bg-white p-2 rounded-lg text-gray-900"
          >
            <option value="">Modalité de garde</option>
            <option value="Au Domicile du Pet-Sitter">Au Domicile du Pet-Sitter</option>
            <option value="Au Domicile du Propriétaire">Au Domicile du Propriétaire</option>
          </select>

          <input
            placeholder="Prix"
            value={form.prix}
            onChange={(e) =>
              setForm({ ...form, prix: e.target.value })
            }
            className="border border-purple-300 bg-white p-2 rounded-lg text-gray-900"
          />

          <textarea
            placeholder="Notes publiques"
            value={form.notesPubliques}
            onChange={(e) =>
              setForm({ ...form, notesPubliques: e.target.value })
            }
            className="col-span-2 border border-purple-300 bg-white p-2 rounded-lg text-gray-900"
          />

          <button
            type="submit"
            className="col-span-2 bg-purple-500 text-white p-3 rounded-xl"
          >
            Ajouter le séjour
          </button>
        </form>

        <div>
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
                <p className="text-gray-800">
                  {booking.dateDebut} → {booking.dateFin}
                </p>
                <p className="text-gray-700">
                  {booking.nombreNuits} nuits
                </p>
                <p className="text-gray-700">
                  Notes : {booking.notesPubliques}
                </p>
                {booking.stayContractLink && (
                  <div className="flex justify-between items-center mt-3">

                    {/* Lien uniquement si pas signé */}
                    {booking.stayContractStatut === "en_attente" && (
                      <a
                        href={booking.stayContractLink}
                        target="_blank"
                        className="text-purple-700 underline"
                      >
                        Voir contrat complémentaire
                      </a>
                    )}

                    {/* Badge */}
                    {booking.stayContractStatut === "en_attente" && (
                      <span className="bg-orange-100 text-orange-700 text-xs px-3 py-1 rounded-full font-medium">
                        ⏳ En attente
                      </span>
                    )}

                    {booking.stayContractStatut === "signé" && (
                      <span className="ml-auto bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-medium">
                        ✅ Contrat signé
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}