"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs } from "firebase/firestore";

export default function DogsPage() {
  const [owners, setOwners] = useState<any[]>([]);
  const [dogs, setDogs] = useState<any[]>([]);

  const [form, setForm] = useState({
    nom: "",
    race: "",
    dateNaissance: "",
    ownerId: "",
  });

  const fetchOwners = async () => {
    const snapshot = await getDocs(collection(db, "owners"));
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setOwners(data);
  };

  const fetchDogs = async () => {
    const snapshot = await getDocs(collection(db, "dogs"));
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setDogs(data);
  };

  useEffect(() => {
    fetchOwners();
    fetchDogs();
  }, []);

  const generateSlug = (name: string) => {
    const random = Math.random().toString(36).substring(2, 8);
    return `${name.toLowerCase()}-${random}`;
  };

  const generatePassword = () => {
    return Math.random().toString(36).substring(2, 10);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const slug = generateSlug(form.nom);
    const motDePasse = generatePassword();

    await addDoc(collection(db, "dogs"), {
      ...form,
      slug,
      motDePasse,
      createdAt: new Date(),
    });

    setForm({
      nom: "",
      race: "",
      dateNaissance: "",
      ownerId: "",
    });

    fetchDogs();
  };

  return (
    <div className="min-h-screen bg-purple-100 p-8">
      <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-xl p-8">
        <h1 className="text-2xl font-bold text-purple-700 mb-6">
          Gestion des Chiens
        </h1>

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 mb-8">
          <input
            placeholder="Nom"
            value={form.nom}
            onChange={(e) => setForm({ ...form, nom: e.target.value })}
            className="border border-purple-200 p-2 rounded-lg text-gray-800"
          />

          <input
            placeholder="Race"
            value={form.race}
            onChange={(e) => setForm({ ...form, race: e.target.value })}
            className="border border-purple-200 p-2 rounded-lg text-gray-800"
          />

          <input
            type="date"
            value={form.dateNaissance}
            onChange={(e) =>
              setForm({ ...form, dateNaissance: e.target.value })
            }
            className="border border-purple-200 p-2 rounded-lg text-gray-800"
          />

          <select
            value={form.ownerId}
            onChange={(e) =>
              setForm({ ...form, ownerId: e.target.value })
            }
            className="border border-purple-200 p-2 rounded-lg text-gray-800"
          >
            <option value="">Sélectionner un maître</option>
            {owners.map((owner) => (
              <option key={owner.id} value={owner.id}>
                {owner.prenom} {owner.nom}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="col-span-2 bg-purple-500 text-white p-3 rounded-xl"
          >
            Ajouter le chien
          </button>
        </form>

        <div>
          {dogs.map((dog) => (
            <div
              key={dog.id}
              className="bg-purple-100 p-4 rounded-xl mb-3 shadow-md border border-purple-200"
            >
              <p className="font-semibold text-purple-900 text-lg">{dog.nom}</p>
              <p className="text-sm text-gray-800">{dog.race}</p>
              <p className="text-xs text-gray-700">
                Slug: {dog.slug} | MDP: {dog.motDePasse}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}