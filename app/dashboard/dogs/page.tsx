"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs } from "firebase/firestore";

export default function AnimalsPage() {
  const [owners, setOwners] = useState<any[]>([]);
  const [animals, setAnimals] = useState<any[]>([]);

  const [form, setForm] = useState({
    nom: "",
    type: "chien",
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

  const fetchAnimals = async () => {
    const snapshot = await getDocs(collection(db, "dogs"));
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setAnimals(data);
  };

  useEffect(() => {
    fetchOwners();
    fetchAnimals();
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
      type: "chien",
      race: "",
      dateNaissance: "",
      ownerId: "",
    });

    fetchAnimals();
  };

  const getEmoji = (type: string) => {
    switch (type) {
      case "chat":
        return "🐱";
      case "lapin":
        return "🐰";
      case "autre":
        return "🐾";
      default:
        return "🐶";
    }
  };

  return (
    <>
      <h1 className="text-2xl font-bold text-purple-900 mb-8">
        Gestion des Animaux
      </h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">

        <select
          value={form.type}
          onChange={(e) =>
            setForm({ ...form, type: e.target.value })
          }
          className="border border-purple-300 bg-white p-3 rounded-xl text-gray-900"
        >
          <option value="chien">🐶 Chien</option>
          <option value="chat">🐱 Chat</option>
          <option value="lapin">🐰 Lapin</option>
          <option value="autre">🐾 Autre</option>
        </select>

        <input
          placeholder="Nom"
          value={form.nom}
          onChange={(e) =>
            setForm({ ...form, nom: e.target.value })
          }
          className="border border-purple-300 bg-white p-3 rounded-xl text-gray-900"
        />

        <input
          placeholder="Race / Espèce"
          value={form.race}
          onChange={(e) =>
            setForm({ ...form, race: e.target.value })
          }
          className="border border-purple-300 bg-white p-3 rounded-xl text-gray-900"
        />

        <input
          type="date"
          value={form.dateNaissance}
          onChange={(e) =>
            setForm({ ...form, dateNaissance: e.target.value })
          }
          className="border border-purple-300 bg-white p-3 rounded-xl text-gray-900"
        />

        <select
          value={form.ownerId}
          onChange={(e) =>
            setForm({ ...form, ownerId: e.target.value })
          }
          className="border border-purple-300 bg-white p-3 rounded-xl text-gray-900 md:col-span-2"
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
          className="md:col-span-2 bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-xl shadow-md transition"
        >
          Ajouter l’animal
        </button>
      </form>

      <div className="space-y-4">
        {animals.map((animal) => (
          <div
            key={animal.id}
            className="bg-purple-50 p-5 rounded-2xl shadow border border-purple-200"
          >
            <p className="font-semibold text-purple-900 text-lg">
              {getEmoji(animal.type)} {animal.nom}
            </p>
            <p className="text-sm text-gray-800">
              {animal.race}
            </p>
            <p className="text-xs text-gray-600 mt-2">
              Slug : {animal.slug} | MDP : {animal.motDePasse}
            </p>
            <a
                href={`/dashboard/dogs/${animal.id}`}
                className="text-purple-700 text-sm underline"
            >
                Voir la fiche admin →
            </a>
          </div>
        ))}
      </div>
    </>
  );
}