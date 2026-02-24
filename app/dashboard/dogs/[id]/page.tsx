"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
  addDoc,
  deleteDoc,
} from "firebase/firestore";

export default function AnimalAdminPage() {
  const { id } = useParams();

  const [animal, setAnimal] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("fiche");
  const [bookings, setBookings] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [docCategory, setDocCategory] = useState("Contrat");
  const [uploading, setUploading] = useState(false);

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
  const uploadPreset = "calm_unsigned";

  const categories = [
    "Contrat",
    "Carte iCad",
    "Ordonnances",
    "Vaccins",
    "Autre",
  ];

    const handleProfileUpload = async (file: File) => {
    const formDataUpload = new FormData();
    formDataUpload.append("file", file);
    formDataUpload.append("upload_preset", uploadPreset);

    const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`,
        { method: "POST", body: formDataUpload }
    );

    const data = await res.json();

    await updateDoc(doc(db, "dogs", animal.id), {
        photoProfil: data.secure_url,
    });

    setAnimal({ ...animal, photoProfil: data.secure_url });
    };

    const veterinaires = [
    "Clinique Vétérinaire Calais Centre",
    "Cabinet Dr Martin",
    "Clinique des Flandres",
    "Clinique Vétérinaire Saint-Pierre",
    ];
  useEffect(() => {
    fetchAnimal();
    fetchBookings();
    fetchDocuments();
  }, [id]);

  const fetchAnimal = async () => {
    if (!id) return;
    const snap = await getDoc(doc(db, "dogs", id as string));
    if (snap.exists()) {
      const data = { id: snap.id, ...snap.data() };
      setAnimal(data);
      setFormData(data);
    }
  };

  const fetchBookings = async () => {
    if (!id) return;
    const q = query(collection(db, "bookings"), where("dogId", "==", id));
    const snap = await getDocs(q);
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setBookings(data);
  };

  const fetchDocuments = async () => {
    if (!id) return;
    const q = query(collection(db, "documents"), where("animalId", "==", id));
    const snap = await getDocs(q);
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setDocuments(data);
  };

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return "-";
    const birth = new Date(birthDate);
    const today = new Date();
    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    if (months < 0) {
      years--;
      months += 12;
    }
    return `${years} ans ${months} mois`;
  };

  const handleSave = async () => {
    await updateDoc(doc(db, "dogs", animal.id), formData);
    setAnimal(formData);
    setEditing(false);
  };

  const handleDocUpload = async (file: File) => {
    setUploading(true);

    const formDataUpload = new FormData();
    formDataUpload.append("file", file);
    formDataUpload.append("upload_preset", uploadPreset);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
      { method: "POST", body: formDataUpload }
    );

    const data = await res.json();

    await addDoc(collection(db, "documents"), {
      animalId: id,
      fileUrl: data.secure_url,
      fileName: file.name,
      category: docCategory,
      createdAt: new Date(),
    });

    setUploading(false);
    fetchDocuments();
  };

  const handleDelete = async (docId: string) => {
    await deleteDoc(doc(db, "documents", docId));
    fetchDocuments();
  };

  if (!animal) return <p>Chargement...</p>;

  const totalNuits = bookings.reduce(
    (acc, b) => acc + (Number(b.nombreNuits) || 0),
    0
  );

  const totalCA = bookings.reduce(
    (acc, b) => acc + (Number(b.prix) || 0),
    0
  );

  const tabStyle = (tab: string) =>
    `px-5 py-2 rounded-t-xl cursor-pointer ${
      activeTab === tab
        ? "bg-white shadow text-black font-semibold"
        : "bg-purple-200 text-black"
    }`;

  return (
    <>
      {/* HEADER */}
      <div className="mb-8">
        <div className="flex items-center gap-6 mb-8">
            <div className="relative">
                <img
                src={
                    animal.photoProfil ||
                    "https://via.placeholder.com/120x120.png?text=Photo"
                }
                className="w-28 h-28 rounded-full object-cover border-4 border-purple-300 shadow"
                />

                <label className="absolute bottom-0 right-0 bg-purple-600 text-white text-xs px-3 py-1 rounded-full cursor-pointer">
                Modifier
                <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) =>
                    e.target.files && handleProfileUpload(e.target.files[0])
                    }
                />
                </label>
            </div>

            <div>
                <h1 className="text-3xl font-bold text-black">
                {animal.nom}
                </h1>
                <p className="text-gray-800">
                {animal.race} • {calculateAge(animal.dateNaissance)}
                </p>
            </div>
            </div>
      </div>

      {/* ONGLET NAV */}
      <div className="flex gap-2 mb-6">
        <div onClick={() => setActiveTab("fiche")} className={tabStyle("fiche")}>
          Fiche
        </div>
        <div onClick={() => setActiveTab("historique")} className={tabStyle("historique")}>
          Historique
        </div>
        <div onClick={() => setActiveTab("documents")} className={tabStyle("documents")}>
          Documents
        </div>
      </div>

      <div className="bg-white p-6 rounded-b-2xl shadow text-black">

        {/* FICHE */}
            {activeTab === "fiche" && (
            <>
                {!editing ? (
                <>
                    <div className="grid grid-cols-2 gap-4">

                    <p><strong>Sexe :</strong> {animal.sexe}</p>
                    <p>
                        <strong>
                        {animal.sexe === "Femelle" ? "Stérilisée" : "Castré"} :
                        </strong>{" "}
                        {animal.sterilise}
                    </p>

                    <p><strong>Date de naissance :</strong> {animal.dateNaissance}</p>
                    <p><strong>Repas :</strong> {animal.repas}</p>

                    <p><strong>Comportement :</strong> {animal.comportement}</p>
                    <p><strong>Maladies / Antécédents :</strong> {animal.maladies}</p>

                    <p><strong>Traitement :</strong> {animal.traitementOuiNon}</p>
                    {animal.traitementOuiNon === "Oui" && (
                        <p><strong>Détail traitement :</strong> {animal.traitementDetail}</p>
                    )}

                    <p><strong>Vétérinaire :</strong> {animal.veterinaire}</p>

                    <p><strong>Sociable humains :</strong> {animal.sociableHumains}</p>
                    <p><strong>Sociable enfants :</strong> {animal.sociableEnfants}</p>
                    <p><strong>Sociable chiens :</strong> {animal.sociableChiens}</p>
                    <p><strong>Sociable chats/NAC :</strong> {animal.sociableChats}</p>

                    </div>

                    <button
                    onClick={() => setEditing(true)}
                    className="mt-6 bg-purple-600 text-white px-4 py-2 rounded-xl"
                    >
                    Modifier
                    </button>
                </>
                ) : (
                <>
                    <div className="grid grid-cols-2 gap-4">

                    {/* Sexe */}
                    <select
                        value={formData.sexe || ""}
                        onChange={(e) =>
                        setFormData({ ...formData, sexe: e.target.value })
                        }
                        className="border p-2 rounded-lg w-full"
                    >
                        <option value="">Sexe</option>
                        <option value="Male">Mâle</option>
                        <option value="Femelle">Femelle</option>
                    </select>

                    {/* Stérilisation */}
                    <select
                        value={formData.sterilise || ""}
                        onChange={(e) =>
                        setFormData({ ...formData, sterilise: e.target.value })
                        }
                        className="border p-2 rounded-lg w-full"
                    >
                        <option value="">Stérilisé / Castré</option>
                        <option value="Oui">Oui</option>
                        <option value="Non">Non</option>
                    </select>

                    {/* Date naissance */}
                    <input
                        type="date"
                        value={formData.dateNaissance || ""}
                        onChange={(e) =>
                        setFormData({ ...formData, dateNaissance: e.target.value })
                        }
                        className="border p-2 rounded-lg w-full"
                    />

                    {/* Repas */}
                    <input
                        placeholder="Repas"
                        value={formData.repas || ""}
                        onChange={(e) =>
                        setFormData({ ...formData, repas: e.target.value })
                        }
                        className="border p-2 rounded-lg w-full"
                    />

                    {/* Comportement */}
                    <textarea
                        placeholder="Comportement"
                        value={formData.comportement || ""}
                        onChange={(e) =>
                        setFormData({ ...formData, comportement: e.target.value })
                        }
                        className="border p-2 rounded-lg w-full col-span-2"
                    />

                    {/* Maladies */}
                    <textarea
                        placeholder="Maladies / Antécédents"
                        value={formData.maladies || ""}
                        onChange={(e) =>
                        setFormData({ ...formData, maladies: e.target.value })
                        }
                        className="border p-2 rounded-lg w-full col-span-2"
                    />

                    {/* Traitement */}
                    <select
                        value={formData.traitementOuiNon || ""}
                        onChange={(e) =>
                        setFormData({
                            ...formData,
                            traitementOuiNon: e.target.value,
                        })
                        }
                        className="border p-2 rounded-lg w-full"
                    >
                        <option value="">Traitement ?</option>
                        <option value="Oui">Oui</option>
                        <option value="Non">Non</option>
                    </select>

                    {formData.traitementOuiNon === "Oui" && (
                        <textarea
                        placeholder="Détail traitement"
                        value={formData.traitementDetail || ""}
                        onChange={(e) =>
                            setFormData({
                            ...formData,
                            traitementDetail: e.target.value,
                            })
                        }
                        className="border p-2 rounded-lg w-full col-span-2"
                        />
                    )}

                    {/* Vétérinaire */}
                        <select
                        value={formData.veterinaire || ""}
                        onChange={(e) =>
                            setFormData({ ...formData, veterinaire: e.target.value })
                        }
                        className="border p-2 rounded-lg w-full"
                        >
                        <option value="">Sélectionner un vétérinaire</option>

                        {veterinaires.map((vet) => (
                            <option key={vet} value={vet}>
                            {vet}
                            </option>
                        ))}
                        </select>

                    {/* Sociabilité */}
                    {[
                        { key: "sociableHumains", label: "Sociable humains" },
                        { key: "sociableEnfants", label: "Sociable enfants" },
                        { key: "sociableChiens", label: "Sociable chiens" },
                        { key: "sociableChats", label: "Sociable chats/NAC" },
                    ].map((item) => (
                        <select
                        key={item.key}
                        value={formData[item.key] || ""}
                        onChange={(e) =>
                            setFormData({
                            ...formData,
                            [item.key]: e.target.value,
                            })
                        }
                        className="border p-2 rounded-lg w-full"
                        >
                        <option value="">{item.label}</option>
                        <option value="Oui">Oui</option>
                        <option value="Non">Non</option>
                        </select>
                    ))}

                    </div>

                    <div className="mt-6 space-x-3">
                    <button
                        onClick={handleSave}
                        className="bg-purple-600 text-white px-4 py-2 rounded-xl"
                    >
                        Enregistrer
                    </button>
                    <button
                        onClick={() => setEditing(false)}
                        className="bg-gray-300 px-4 py-2 rounded-xl"
                    >
                        Annuler
                    </button>
                    </div>
                </>
                )}
            </>
            )}

        {/* HISTORIQUE */}
        {activeTab === "historique" && (
          <>
            <div className="mb-6 bg-purple-50 p-4 rounded-xl">
              <p><strong>Total nuits :</strong> {totalNuits}</p>
              <p><strong>Total généré :</strong> {totalCA} €</p>
            </div>

            {bookings.map((b) => (
              <div key={b.id} className="bg-purple-50 p-4 rounded-xl mb-3">
                <p><strong>{b.dateDebut} → {b.dateFin}</strong></p>
                <p>{b.nombreNuits} nuits</p>
                <p>{b.prix} €</p>
                {b.notes && <p className="text-gray-700">{b.notes}</p>}
              </div>
            ))}
          </>
        )}

        {/* DOCUMENTS */}
        {activeTab === "documents" && (
        <>
            {/* Upload + catégorie */}
            <div className="flex gap-3 mb-6 items-center">
            <select
                value={docCategory}
                onChange={(e) => setDocCategory(e.target.value)}
                className="border border-purple-300 p-2 rounded-lg"
            >
                {categories.map((cat) => (
                <option key={cat} value={cat}>
                    {cat}
                </option>
                ))}
            </select>

            <label className="cursor-pointer bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl transition">
                Ajouter un document
                <input
                type="file"
                hidden
                onChange={(e) =>
                    e.target.files && handleDocUpload(e.target.files[0])
                }
                />
            </label>
            </div>

            {/* Affichage par catégorie */}
            {categories.map((cat) => {
            const docsByCat = documents.filter(
                (doc) => doc.category === cat
            );

            if (docsByCat.length === 0) return null;

            return (
                <div key={cat} className="mb-8">
                <h3 className="font-semibold text-lg mb-3 text-purple-800">
                    {cat}
                </h3>

                {docsByCat.map((doc) => (
                    <div
                    key={doc.id}
                    className="bg-purple-50 p-4 rounded-xl mb-3 shadow flex justify-between items-center"
                    >
                    <div>
                        <p className="font-medium text-black">
                        {doc.fileName}
                        </p>
                    </div>

                    <div className="flex gap-4 items-center">

                        {/* OUVRIR */}
                        <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-700 hover:underline"
                        >
                        Ouvrir
                        </a>

                        {/* TELECHARGER */}
                        <a
                        href={doc.fileUrl}
                        download
                        className="text-green-700 hover:underline"
                        >
                        Télécharger
                        </a>

                        {/* SUPPRIMER */}
                        <button
                        onClick={() => handleDelete(doc.id)}
                        className="text-red-600 hover:underline"
                        >
                        Supprimer
                        </button>

                    </div>
                    </div>
                ))}
                </div>
            );
            })}
        </>
        )}
      </div>
    </>
  );
}