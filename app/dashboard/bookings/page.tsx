"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { formatDate } from "@/lib/formatDate";

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
    typePrestation: "pension",
    heureArrivee: "",
    heureDepart: "",
    checklist: { carnetSante: false, nourriture: false, traitement: false, harnais: false },
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDetails, setEditDetails] = useState({
    dateDebut: "",
    dateFin: "",
    prix: "",
    notesPubliques: "",
    typePrestation: "pension",
    heureArrivee: "",
    heureDepart: "",
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

    if (new Date(form.dateFin) <= new Date(form.dateDebut)) {
      alert("La date de fin doit être après la date de début.");
      return;
    }

    const overlapsExistingStay = bookings.some((booking) =>
      booking.dogId === form.dogId &&
      new Date(form.dateDebut) < new Date(booking.dateFin) &&
      new Date(form.dateFin) > new Date(booking.dateDebut),
    );
    if (overlapsExistingStay) {
      alert("Cet animal a déjà un séjour qui chevauche ces dates.");
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

    await fetch("/api/notify-client/stay-contract-created", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${await auth.currentUser?.getIdToken()}` },
      body: JSON.stringify({ stayContractId: stayContractRef.id }),
    });

    setForm({
      dogId: "",
      dateDebut: "",
      dateFin: "",
      prix: "",
      notesPubliques: "",
      modalite: "",
      typePrestation: "pension",
      heureArrivee: "",
      heureDepart: "",
      checklist: { carnetSante: false, nourriture: false, traitement: false, harnais: false },
    });

    fetchBookings();
  };

  // 🔹 UPDATE DATES
  const handleUpdateDates = async (booking: any) => {
    if (!editDetails.dateDebut || !editDetails.dateFin) {
      alert("Dates invalides");
      return;
    }

    if (new Date(editDetails.dateFin) <= new Date(editDetails.dateDebut)) {
      alert("La date de fin doit être après la date de début");
      return;
    }

    const nights = calculateNights(editDetails.dateDebut, editDetails.dateFin);

    await updateDoc(doc(db, "bookings", booking.id), {
      ...editDetails,
      dateDebut: editDetails.dateDebut,
      dateFin: editDetails.dateFin,
      nombreNuits: nights,
    });

    if (booking.stayContractId) {
      await updateDoc(doc(db, "stayContracts", booking.stayContractId), {
        dateDebut: editDetails.dateDebut,
        dateFin: editDetails.dateFin,
      });
    }

    setEditingId(null);
    fetchBookings();
  };
  const plannedNights = form.dateDebut && form.dateFin && new Date(form.dateFin) > new Date(form.dateDebut) ? calculateNights(form.dateDebut, form.dateFin) : 0;

  const toggleChecklistItem = async (booking: any, key: "carnetSante" | "nourriture" | "traitement" | "harnais") => {
    const checklist = { carnetSante: false, nourriture: false, traitement: false, harnais: false, ...(booking.checklist ?? {}) };
    checklist[key] = !checklist[key];
    await updateDoc(doc(db, "bookings", booking.id), { checklist });
    setBookings((current) => current.map((item) => item.id === booking.id ? { ...item, checklist } : item));
  };

  return (
    <div className="space-y-8">
      <header className="page-intro"><div><p className="eyebrow">Les séjours</p><h1>Le rythme doux de la maison.</h1><p>Planifiez chaque accueil, gardez le contrat à portée de main et ne perdez aucun détail.</p></div><span className="page-count">{bookings.length} séjour{bookings.length > 1 ? "s" : ""}</span></header>
      <div className="calm-panel">
        <div className="section-heading"><div><p className="eyebrow">Nouvel accueil</p><h2>Programmer un séjour</h2></div><p>Le contrat complémentaire est préparé automatiquement.</p></div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="calm-form-grid mb-10">
          <select
            value={form.dogId}
            onChange={(e) =>
              setForm({ ...form, dogId: e.target.value })
            }
            className="calm-control"
          >
            <option value="">Sélectionner un chien</option>
            {dogs.map((dog) => (
              <option key={dog.id} value={dog.id}>
                {dog.nom}
              </option>
            ))}
          </select>

          <select value={form.typePrestation} onChange={(e) => setForm({ ...form, typePrestation: e.target.value })} className="calm-control"><option value="pension">Pension à la maison</option><option value="visite">Visite à domicile</option><option value="promenade">Promenade</option><option value="journee">Journée d’accueil</option></select>

          <label className="calm-label">Arrivée<input type="date" value={form.dateDebut} onChange={(e) => setForm({ ...form, dateDebut: e.target.value })} /></label>

          <label className="calm-label">Heure d’arrivée <span className="label-optional">facultatif</span><input type="time" value={form.heureArrivee} onChange={(e) => setForm({ ...form, heureArrivee: e.target.value })} /></label>

          <label className="calm-label">Départ<input type="date" value={form.dateFin} min={form.dateDebut} onChange={(e) => setForm({ ...form, dateFin: e.target.value })} /></label>

          <label className="calm-label">Heure de départ <span className="label-optional">facultatif</span><input type="time" value={form.heureDepart} onChange={(e) => setForm({ ...form, heureDepart: e.target.value })} /></label>

          <input
            placeholder="Tarif du séjour (€)"
            value={form.prix}
            onChange={(e) =>
              setForm({ ...form, prix: e.target.value })
            }
            className="calm-control"
          />
          {plannedNights > 0 && <p className="col-span-2 rounded-xl bg-[#edf5ef] px-4 py-3 text-sm font-semibold text-[#315e4e]">Durée estimée : {plannedNights} nuit{plannedNights > 1 ? "s" : ""}.</p>}

          <textarea
            placeholder="Une note à transmettre à la famille (facultatif)"
            value={form.notesPubliques}
            onChange={(e) =>
              setForm({ ...form, notesPubliques: e.target.value })
            }
            className="col-span-2 calm-control min-h-24"
          />

          <fieldset className="col-span-2 stay-checklist"><legend>Préparer l’arrivée</legend><p>À cocher au fil de la préparation.</p><div>{([['carnetSante', 'Carnet de santé'], ['nourriture', 'Nourriture reçue'], ['traitement', 'Traitement noté'], ['harnais', 'Harnais / laisse']] as const).map(([key, label]) => <label key={key}><input type="checkbox" checked={form.checklist[key]} onChange={(event) => setForm({ ...form, checklist: { ...form.checklist, [key]: event.target.checked } })} />{label}</label>)}</div></fieldset>

          <button
            type="submit"
            className="calm-primary col-span-2"
          >
            Créer le séjour <span>→</span>
          </button>
        </form>

        {/* BOOKINGS LIST */}
          {bookings.map((booking) => {
            const dog = dogs.find((d) => d.id === booking.dogId);

            return (
              <div
                key={booking.id}
                className="stay-card"
              >
                <p className="text-lg font-bold text-[#1d3029]">
                  {dog?.nom || "Chien inconnu"}
                </p>

                {editingId === booking.id ? (
                  <div className="space-y-2 mt-2">
                    <input
                      type="date"
                      value={editDetails.dateDebut}
                      onChange={(e) =>
                        setEditDetails({
                          ...editDetails,
                          dateDebut: e.target.value,
                        })
                      }
                      className="calm-control"
                    />

                    <input
                      type="date"
                      value={editDetails.dateFin}
                      onChange={(e) =>
                        setEditDetails({
                          ...editDetails,
                          dateFin: e.target.value,
                        })
                      }
                      className="calm-control"
                    />

                    <select value={editDetails.typePrestation} onChange={(e) => setEditDetails({ ...editDetails, typePrestation: e.target.value })} className="calm-control"><option value="pension">Pension à la maison</option><option value="visite">Visite à domicile</option><option value="promenade">Promenade</option><option value="journee">Journée d’accueil</option></select>
                    <input type="time" aria-label="Heure d’arrivée" value={editDetails.heureArrivee} onChange={(e) => setEditDetails({ ...editDetails, heureArrivee: e.target.value })} className="calm-control" />
                    <input type="time" aria-label="Heure de départ" value={editDetails.heureDepart} onChange={(e) => setEditDetails({ ...editDetails, heureDepart: e.target.value })} className="calm-control" />
                    <input type="number" min="0" placeholder="Tarif (€)" value={editDetails.prix} onChange={(e) => setEditDetails({ ...editDetails, prix: e.target.value })} className="calm-control" />
                    <textarea rows={3} placeholder="Note pour la famille" value={editDetails.notesPubliques} onChange={(e) => setEditDetails({ ...editDetails, notesPubliques: e.target.value })} className="calm-control" />

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateDates(booking)}
                        className="calm-primary px-4 py-2 text-sm"
                      >
                        Enregistrer
                      </button>

                      <button
                        onClick={() => setEditingId(null)}
                        className="text-sm text-[#718078]"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="mt-1 font-semibold text-[#41594d]">Du {formatDate(booking.dateDebut)} au {formatDate(booking.dateFin)}</p>
                    <p className="mt-1 text-sm text-[#718078]">{booking.nombreNuits} nuit{booking.nombreNuits > 1 ? "s" : ""}</p>
                    <p className="mt-1 text-sm text-[#61736a]">{booking.typePrestation || "Pension à la maison"}{booking.heureArrivee && ` · arrivée ${booking.heureArrivee}`}{booking.heureDepart && ` · départ ${booking.heureDepart}`}</p>
                    {booking.notesPubliques && <p className="mt-3 rounded-xl border border-[#e3e9df] bg-[#fafcf9] p-3 text-sm leading-6 text-[#5c7165]"><b className="text-[#315e4e]">Note pour la famille :</b> {booking.notesPubliques}</p>}
                    <div className="mt-4 rounded-xl bg-[#f2f7f3] p-3"><p className="text-xs font-bold uppercase tracking-[.12em] text-[#52705f]">Préparation · {Object.values(booking.checklist ?? {}).filter(Boolean).length}/4</p><div className="mt-2 flex flex-wrap gap-2">{([['carnetSante', 'Carnet'], ['nourriture', 'Nourriture'], ['traitement', 'Traitement'], ['harnais', 'Laisse']] as const).map(([key, label]) => <button key={key} onClick={() => toggleChecklistItem(booking, key)} className={`rounded-full px-3 py-1 text-xs font-semibold transition ${booking.checklist?.[key] ? 'bg-[#315e4e] text-white' : 'bg-white text-[#607168] ring-1 ring-[#d9e6dc]'}`}>{booking.checklist?.[key] ? '✓ ' : ''}{label}</button>)}</div></div>

                    <div className="flex justify-between items-center mt-3">
                      {/* Lien contrat si en attente */}
                      {booking.stayContractStatut === "en_attente" &&
                        booking.stayContractLink && (
                          <a
                            href={booking.stayContractLink}
                            target="_blank"
                            className="text-sm font-semibold text-[#315e4e] underline"
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
                          setEditDetails({
                            dateDebut: booking.dateDebut,
                            dateFin: booking.dateFin,
                            prix: booking.prix || "",
                            notesPubliques: booking.notesPubliques || "",
                            typePrestation: booking.typePrestation || "pension",
                            heureArrivee: booking.heureArrivee || "",
                            heureDepart: booking.heureDepart || "",
                          });
                        }}
                        className="mt-4 text-sm font-semibold text-[#315e4e] underline"
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
