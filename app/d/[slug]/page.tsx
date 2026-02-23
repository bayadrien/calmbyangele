"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useParams } from "next/navigation";

export default function DogPublicPage() {
  const { slug } = useParams();
  const [dog, setDog] = useState<any>(null);
  const [password, setPassword] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [activeImage, setActiveImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchDogAndBookings = async () => {
        // 1️⃣ Récupérer le chien via le slug
        const q = query(
        collection(db, "dogs"),
        where("slug", "==", slug)
        );

        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
        const dogData = {
            id: snapshot.docs[0].id,
            ...snapshot.docs[0].data(),
        };

        setDog(dogData);

        // 2️⃣ Récupérer les séjours liés à ce chien
        const bookingsQuery = query(
            collection(db, "bookings"),
            where("dogId", "==", dogData.id)
        );

        const bookingsSnapshot = await getDocs(bookingsQuery);

        const bookingsData = bookingsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        setBookings(bookingsData);
        // Récupérer les photos liées aux séjours
        const photoQuery = query(
        collection(db, "photos"),
        where("bookingId", "in", bookingsData.map(b => b.id))
        );

        if (bookingsData.length > 0) {
        const photoSnapshot = await getDocs(photoQuery);
        const photoData = photoSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));
        setPhotos(photoData);
        }
        }
    };

    if (slug) {
        fetchDogAndBookings();
    }
    }, [slug]);

  if (!dog) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-purple-100">
        <p className="text-purple-800">Chargement...</p>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-purple-100">
        <div className="bg-white p-8 rounded-3xl shadow-xl text-center">
          <h1 className="text-2xl font-bold text-purple-900 mb-4">
            {dog.nom}
          </h1>

          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-purple-300 p-2 rounded-lg text-gray-900 mb-4"
          />

          <br />

          <button
            onClick={() => {
              if (password === dog.motDePasse) {
                setAuthorized(true);
              } else {
                alert("Mot de passe incorrect");
              }
            }}
            className="bg-purple-500 text-white px-6 py-2 rounded-xl"
          >
            Accéder
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-purple-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-purple-900 mb-4">
          {dog.nom}
        </h1>

        <p className="text-gray-800">Race : {dog.race}</p>
        <p className="text-gray-800 mb-6">
          Date de naissance : {dog.dateNaissance}
        </p>

        <div className="bg-purple-100 p-6 rounded-2xl">
          <h2 className="text-xl font-bold text-purple-900 mb-4">
            Séjours
            </h2>

            {bookings.length === 0 && (
            <p className="text-gray-700">Aucun séjour pour le moment.</p>
            )}

            {bookings.map((booking) => {
            const photosForBooking = photos.filter(
                (photo) => photo.bookingId === booking.id
            );

            return (
                <div
                key={booking.id}
                className="mb-10"
                >
                <div className="mb-4">
                    <p className="text-purple-900 font-semibold text-lg">
                    {booking.dateDebut} → {booking.dateFin}
                    </p>
                    <p className="text-gray-700">
                    {booking.nombreNuits} nuits
                    </p>
                    {booking.notesPubliques && (
                    <p className="text-gray-800 mt-2">
                        {booking.notesPubliques}
                    </p>
                    )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    {photosForBooking.map((photo) => (
                    <div
                        key={photo.id}
                        className="bg-white p-4 rounded-2xl shadow-md border border-purple-200 transform hover:scale-105 transition"
                    >
                    <div
                        key={photo.id}
                        className="p-4 rounded-2xl transform hover:scale-105 transition relative"
                    >
                    {/* Badge date */}
                    {photo.createdAt && (
                        <div className="absolute top-3 right-3 bg-purple-500 text-white text-xs px-3 py-1 rounded-full shadow">
                        {new Date(
                            photo.createdAt.seconds
                            ? photo.createdAt.seconds * 1000
                            : photo.createdAt
                        ).toLocaleDateString()}
                        </div>
                    )}

                        <img
                        src={photo.imageUrl}
                        alt="photo"
                        onClick={() => setActiveImage(photo.imageUrl)}
                        className="rounded-xl mb-3 shadow-lg cursor-pointer hover:opacity-90 transition"
                        />

                    {photo.caption && (
                        <p className="text-sm text-gray-700">
                        {photo.caption}
                        </p>
                    )}
                    </div>
                        {photo.caption && (
                        <p className="text-sm text-gray-700">
                            {photo.caption}
                        </p>
                        )}
                    </div>
                    ))}
                </div>
                </div>
            );
            })}
        </div>
      </div>

      {activeImage && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="relative max-w-4xl w-full">
            
            {/* Bouton fermer */}
            <button
                onClick={() => setActiveImage(null)}
                className="absolute top-4 right-4 bg-white text-purple-700 px-4 py-2 rounded-full shadow-md"
            >
                ✕
            </button>

            {/* Image agrandie */}
            <img
                src={activeImage}
                alt="Agrandie"
                className="rounded-2xl shadow-2xl max-h-[80vh] mx-auto"
            />

            {/* Bouton téléchargement */}
            <div className="text-center mt-4">
                <a
                href={activeImage}
                download
                className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl shadow-md transition"
                >
                Télécharger 📥
                </a>
            </div>
            </div>
        </div>
        )}
    </div>
  );
}