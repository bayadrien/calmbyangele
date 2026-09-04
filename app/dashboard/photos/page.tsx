"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, addDoc, getDocs, doc, getDoc } from "firebase/firestore";
import { formatDate } from "@/lib/formatDate";

export default function PhotosPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [selectedBooking, setSelectedBooking] = useState("");
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [photoCount, setPhotoCount] = useState(0);

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
  const uploadPreset = "calm_unsigned";

  const fetchBookings = async () => {
    const snapshot = await getDocs(collection(db, "bookings"));

    const data = await Promise.all(
      snapshot.docs.map(async (bookingDoc) => {
        const booking = { id: bookingDoc.id, ...(bookingDoc.data() as any) };
        const dogSnap = await getDoc(doc(db, "dogs", booking.dogId));

        return {
          ...booking,
          dogName: dogSnap.exists() ? dogSnap.data().nom : "Chien inconnu",
        };
      })
    );

    setBookings(data);
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    const fetchPhotoCount = async () => {
      if (!selectedBooking) return;

      const snapshot = await getDocs(collection(db, "photos"));

      const count = snapshot.docs.filter(
        (doc) => doc.data().bookingId === selectedBooking
      ).length;

      setPhotoCount(count);
    };

    fetchPhotoCount();
  }, [selectedBooking]);

  const handleUpload = async () => {
    if (!selectedBooking) {
      alert("Sélectionne un séjour.");
      return;
    }

    if (!selectedFile) {
      alert("Choisis une photo.");
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("upload_preset", uploadPreset);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await res.json();

    await addDoc(collection(db, "photos"), {
      bookingId: selectedBooking,
      imageUrl: data.secure_url,
      caption: caption || "",
      createdAt: new Date(),
    });

    const imageUrl = data.secure_url;

    // Récupérer le booking sélectionné
    const bookingSnap = await getDoc(doc(db, "bookings", selectedBooking));

    if (bookingSnap.exists()) {
      const bookingData = bookingSnap.data();

      const dogSnap = await getDoc(doc(db, "dogs", bookingData.dogId));

      if (dogSnap.exists()) {
        const dogData = dogSnap.data();

        // Vérifier si galerie activée
        if (dogData.galleryEnabled) {
          const ownerSnap = await getDoc(doc(db, "owners", dogData.ownerId));

          if (ownerSnap.exists()) {
            const ownerData = ownerSnap.data();

            await fetch("/api/notify-client/gallery-update", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${await auth.currentUser?.getIdToken()}` },
              body: JSON.stringify({
                dogId: bookingData.dogId,
                dogName: dogData.nom,
                ownerName: ownerData.prenom + " " + ownerData.nom,
                ownerEmail: ownerData.email,
                galleryUrl: `${process.env.NEXT_PUBLIC_APP_URL}/d/${dogData.slug}`,
                imageUrl: imageUrl,
              }),
            });
          }
        }
      }
    }

    // Reset
    setCaption("");
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploading(false);

    alert("Photo ajoutée 💜");
  };

  return (
    <div className="min-h-screen bg-purple-200 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl p-8">
        <h1 className="text-2xl font-bold text-purple-900 mb-6">
          Ajouter une photo
        </h1>

        {/* Sélection séjour */}
        <select
          value={selectedBooking}
          onChange={(e) => setSelectedBooking(e.target.value)}
          className="border border-purple-400 bg-white p-3 rounded-xl text-gray-900 mb-6 w-full focus:outline-none focus:ring-2 focus:ring-purple-400"
        >
          <option value="">Sélectionner un séjour</option>
          {bookings.map((booking) => (
            <option key={booking.id} value={booking.id}>
              {booking.dogName} • {formatDate(booking.dateDebut)} → {formatDate(booking.dateFin)}
            </option>
          ))}
        </select>

        {selectedBooking && (
          <p className="text-sm text-purple-700 mb-4">
            📸 {photoCount} photo{photoCount > 1 ? "s" : ""} déjà dans ce séjour
          </p>
        )}

        {/* Zone upload photo */}
        <div className="mb-6">
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-purple-400 bg-purple-50 hover:bg-purple-100 transition rounded-2xl p-8 cursor-pointer text-center">

            <div className="text-4xl mb-2">📸</div>

            <p className="text-purple-800 font-semibold">
              Cliquez pour sélectionner une photo
            </p>

            <p className="text-sm text-gray-600 mt-1">
              JPG, PNG ou HEIC
            </p>

            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                if (e.target.files) {
                  const file = e.target.files[0];
                  setSelectedFile(file);
                  setPreviewUrl(URL.createObjectURL(file));
                }
              }}
            />
          </label>

          {selectedFile && (
            <p className="text-sm text-gray-700 mt-3 text-center">
              📄 {selectedFile.name}
            </p>
          )}
        </div>

        {/* Aperçu image */}
        {previewUrl && (
          <div className="mb-6">
            <img
              src={previewUrl}
              alt="Preview"
              className="rounded-2xl shadow-md max-h-72"
            />
          </div>
        )}

        {selectedFile && (
          <button
            onClick={() => {
              setSelectedFile(null);
              setPreviewUrl(null);
            }}
            className="text-red-500 text-sm mt-2"
          >
            Supprimer la photo
          </button>
        )}

        {/* Caption */}
        <textarea
          placeholder="Petit texte (optionnel)"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="border border-purple-400 bg-white p-3 rounded-xl text-gray-900 placeholder-gray-400 w-full mb-6 focus:outline-none focus:ring-2 focus:ring-purple-400"
        />

        {/* Bouton upload */}
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white px-6 py-3 rounded-xl shadow-md transition"
        >
          {uploading ? "Upload en cours..." : "Uploader la photo"}
        </button>
      </div>
    </div>
  );
}
