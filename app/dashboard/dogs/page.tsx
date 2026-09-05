"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";

export default function AnimalsPage() {
  const [owners, setOwners] = useState<any[]>([]);
  const [animals, setAnimals] = useState<any[]>([]);

  const [form, setForm] = useState({
    nom: "",
    type: "chien",
    race: "",
    dateNaissance: "",
    ownerId: "",
    temperament: "",
    alertesSante: "",
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

    const animalsData = await Promise.all(
      snapshot.docs.map(async (docSnap) => {
        const animalData = { id: docSnap.id, ...docSnap.data() };

        // 🔹 Chercher contrat initial de CET animal
        const q = query(
          collection(db, "contracts"),
          where("dogId", "==", docSnap.id)
        );

        const contractSnap = await getDocs(q);

        let contractStatut = null;
        let contractToken = null;

        if (!contractSnap.empty) {
          const contractData = contractSnap.docs[0].data();
          contractStatut = contractData.statut;
          contractToken = contractData.token;
        }

        return {
          ...animalData,
          contractStatut,
          contractToken,
        };
      })
    );

    setAnimals(animalsData);
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
      temperament: "",
      alertesSante: "",
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

  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  const createContract = async (dogId: string, ownerId: string) => {
    try {
      const token = crypto.randomUUID();

      await addDoc(collection(db, "contracts"), {
        ownerId,
        dogId,
        dateDebut: new Date(),
        dateFin: new Date(),
        statut: "en_attente",
        token,
        version: "v1",
        createdAt: new Date(),
      });

      const link = `${window.location.origin}/contrat/${token}`;
      setGeneratedLink(link);

    } catch (error) {
      console.error(error);
      alert("Erreur lors de la création du contrat");
    }
  };

  return (
    <>
      <header className="page-intro mb-8"><div><p className="eyebrow">Les animaux</p><h1>Chaque personnalité a sa fiche.</h1><p>Le point de départ pour préparer un accueil attentif et sur mesure.</p></div><span className="page-count">{animals.length} compagnon{animals.length > 1 ? "s" : ""}</span></header>

      <section className="calm-panel mb-10"><div className="section-heading"><div><p className="eyebrow">Nouveau compagnon</p><h2>Créer sa fiche</h2></div></div><form onSubmit={handleSubmit} className="calm-form-grid">

        <select
          value={form.type}
          onChange={(e) =>
            setForm({ ...form, type: e.target.value })
          }
          className="calm-control"
        >
          <option value="chien">🐶 Chien</option>
          <option value="chat">🐱 Chat</option>
          <option value="lapin">🐰 Lapin</option>
          <option value="autre">🐾 Autre</option>
        </select>

        <input
          placeholder="Son prénom"
          value={form.nom}
          onChange={(e) =>
            setForm({ ...form, nom: e.target.value })
          }
          className="calm-control"
        />

        <input placeholder="Tempérament (joueur, réservé…)" value={form.temperament} onChange={(e) => setForm({ ...form, temperament: e.target.value })} className="calm-control" />
        <input placeholder="Santé / allergies à connaître" value={form.alertesSante} onChange={(e) => setForm({ ...form, alertesSante: e.target.value })} className="calm-control" />

        <input
          placeholder="Race ou espèce"
          value={form.race}
          onChange={(e) =>
            setForm({ ...form, race: e.target.value })
          }
          className="calm-control"
        />

        <input
          type="date"
          value={form.dateNaissance}
          onChange={(e) =>
            setForm({ ...form, dateNaissance: e.target.value })
          }
          className="calm-control"
        />

        <select
          value={form.ownerId}
          onChange={(e) =>
            setForm({ ...form, ownerId: e.target.value })
          }
          className="calm-control md:col-span-2"
        >
          <option value="">Choisir sa famille</option>
          {owners.map((owner) => (
            <option key={owner.id} value={owner.id}>
              {owner.prenom} {owner.nom}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="calm-primary md:col-span-2"
        >
          Ajouter ce compagnon <span>→</span>
        </button>
      </form></section>

      <div className="space-y-4">
        {animals.map((animal) => (
          <div
            key={animal.id}
            className="pet-card"
          >
            <p className="font-semibold text-purple-900 text-lg">
              <span>{getEmoji(animal.type)}</span> {animal.nom}
            </p>
            <p className="text-sm text-gray-800">
              {animal.race}
            </p>
            {(animal.temperament || animal.alertesSante) && <p className="mt-2 text-xs text-[#52675b]">{animal.temperament && `• ${animal.temperament} `}{animal.alertesSante && `• Santé : ${animal.alertesSante}`}</p>}
            <p className="text-xs text-gray-600 mt-2">
              Galerie privée prête à partager
            </p>
            <a
                href={`/dashboard/dogs/${animal.id}`}
                className="text-purple-700 text-sm underline"
            >
                Ouvrir la fiche complète →
            </a>

            <div className="flex items-center gap-3 mt-3">
              {animal.contractStatut === "en_attente" && (
                <>
                  <span className="bg-orange-100 text-orange-700 text-xs px-3 py-1 rounded-full font-medium">
                    ⏳ En attente
                  </span>

                  <a
                    href={`/contrat/${animal.contractToken}`}
                    className="bg-purple-600 text-white px-4 py-2 rounded-xl"
                  >
                    Voir le contrat
                  </a>
                </>
              )}

              {animal.contractStatut === "signé" && (
                <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-medium">
                  ✅ Contrat initial validé
                </span>
              )}

              {!animal.contractStatut && (
                <button
                  onClick={() => createContract(animal.id, animal.ownerId)}
                  className="bg-purple-600 text-white px-4 py-2 rounded-xl"
                >
                  Préparer le contrat
                </button>
              )}

            </div>
          </div>
        ))}

        {generatedLink && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-2xl shadow-xl max-w-md w-full">
              <h2 className="text-xl font-bold text-purple-900 mb-4">
                Contrat prêt à envoyer
              </h2>

              <p className="text-sm text-gray-700 mb-3">
                Transmettez ce lien à la famille :
              </p>

              <input
                value={generatedLink}
                readOnly
                className="w-full border border-purple-300 p-2 rounded-lg text-sm mb-4"
              />

              <div className="flex justify-between gap-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedLink);
                  }}
                  className="bg-purple-600 text-white px-4 py-2 rounded-xl w-full"
                >
                  Copier le lien
                </button>

                <button
                  onClick={() => setGeneratedLink(null)}
                  className="bg-gray-200 px-4 py-2 rounded-xl w-full"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
