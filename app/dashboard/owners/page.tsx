"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs } from "firebase/firestore";

export default function OwnersPage() {
  const [owners, setOwners] = useState<any[]>([]);
  const [form, setForm] = useState({
    prenom: "",
    nom: "",
    email: "",
    telephone: "",
    adresse: "",
    contactUrgence: "",
    notes: "",
  });

  const fetchOwners = async () => {
    const querySnapshot = await getDocs(collection(db, "owners"));
    const data = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setOwners(data);
  };

  useEffect(() => {
    fetchOwners();
  }, []);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    await addDoc(collection(db, "owners"), form);
    setForm({
      prenom: "",
      nom: "",
      email: "",
      telephone: "",
      adresse: "",
      contactUrgence: "",
      notes: "",
    });
    fetchOwners();
  };

  return (
    <div className="min-h-screen bg-purple-100 p-8">
      <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-xl p-8">
        <h1 className="text-2xl font-bold text-purple-700 mb-6">
          Gestion des Maîtres
        </h1>

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 mb-8">
          {Object.keys(form).map((key) => (
            <input
              key={key}
              placeholder={key}
              value={(form as any)[key]}
              onChange={(e) =>
                setForm({ ...form, [key]: e.target.value })
              }
              className="border border-purple-200 p-2 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
          ))}
          <button
            type="submit"
            className="col-span-2 bg-purple-500 text-white p-3 rounded-xl"
          >
            Ajouter
          </button>
        </form>

        <div>
          {owners.map((owner) => (
            <div
              key={owner.id}
              className="bg-purple-50 p-4 rounded-xl mb-3 shadow"
            >
              <p className="font-semibold">
                {owner.prenom} {owner.nom}
              </p>
              <p className="text-sm text-gray-600">{owner.email}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}