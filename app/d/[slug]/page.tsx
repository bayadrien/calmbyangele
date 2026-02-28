"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { useParams } from "next/navigation";

export default function DogPublicPage() {
  const { slug } = useParams();

  const [dog, setDog] = useState<any>(null);
  const [password, setPassword] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [activeImage, setActiveImage] = useState<string | null>(null);

  // ===============================
  // FETCH DATA
  // ===============================
  useEffect(() => {
    const fetchData = async () => {
      const dogQuery = query(
        collection(db, "dogs"),
        where("slug", "==", slug)
      );

      const dogSnapshot = await getDocs(dogQuery);

      if (dogSnapshot.empty) return;

      const dogData = {
        id: dogSnapshot.docs[0].id,
        ...dogSnapshot.docs[0].data(),
      };

      setDog(dogData);

      // Bookings
      const bookingQuery = query(
        collection(db, "bookings"),
        where("dogId", "==", dogData.id)
      );

      const bookingSnapshot = await getDocs(bookingQuery);
      const bookingData = bookingSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setBookings(bookingData);

      // Photos (safe version, no "in" limit issue)
      let allPhotos: any[] = [];

      for (const booking of bookingData) {
        const photoQuery = query(
          collection(db, "photos"),
          where("bookingId", "==", booking.id)
        );

        const photoSnapshot = await getDocs(photoQuery);
        const photoData = photoSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        allPhotos = [...allPhotos, ...photoData];
      }

      setPhotos(allPhotos);
    };

    if (slug) fetchData();
  }, [slug]);

  // ===============================
  // LOADING
  // ===============================
  if (!dog) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-purple-100">
        <p className="text-purple-800">Chargement...</p>
      </div>
    );
  }

  // ===============================
  // GALLERY DISABLED
  // ===============================
  if (dog.galleryEnabled !== true) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-purple-100">
        <div className="bg-white p-8 rounded-3xl shadow-xl text-center">
          <h1 className="text-xl font-bold text-purple-900 mb-4">
            Galerie temporairement indisponible
          </h1>
          <p className="text-gray-700">
            L’accès à la galerie n’est pas encore activé.
          </p>
        </div>
      </div>
    );
  }

  // ===============================
  // PASSWORD
  // ===============================
  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-purple-100">
        <div className="bg-white p-10 rounded-3xl shadow-xl text-center w-full max-w-md">
          <h1 className="text-2xl font-bold text-purple-900 mb-6">
            {dog.nom}
          </h1>

          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-purple-300 p-3 rounded-xl w-full mb-6"
          />

          <button
            onClick={() => {
              if (password === dog.motDePasse) {
                setAuthorized(true);
              } else {
                alert("Mot de passe incorrect");
              }
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl w-full transition"
          >
            Accéder à la galerie
          </button>
        </div>
      </div>
    );
  }

  // ===============================
  // MAIN PAGE
  // ===============================
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 to-purple-200 py-12 px-6">

      {/* HERO */}
      <div className="max-w-5xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-bold text-purple-900 mb-2">
          {dog.nom}
        </h1>

        <p className="text-purple-700">
          Bienvenue dans son album de séjour 🐾
        </p>

        <div className="mt-4 flex justify-center gap-6 text-sm text-purple-800">
          <span>📸 {photos.length} souvenir{photos.length > 1 ? "s" : ""}</span>
          <span>🏡 {bookings.length} séjour{bookings.length > 1 ? "s" : ""}</span>
          <span className="bg-white px-3 py-1 rounded-full shadow text-purple-700">
            🔒 Galerie privée
          </span>
        </div>
      </div>

      {/* PROFILE CARD */}
      <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-xl p-10 mb-12">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <img
            src={dog.photoProfil || "https://via.placeholder.com/150"}
            className="w-32 h-32 rounded-full object-cover shadow-lg border-4 border-purple-200"
          />

          <div>
            <h2 className="text-2xl font-semibold text-purple-900">
              {dog.nom}
            </h2>
            <p className="text-gray-700">{dog.race}</p>
            <p className="text-gray-600 mt-2">
              Né le {dog.dateNaissance}
            </p>

            <span className="inline-block mt-4 bg-purple-100 text-purple-700 text-xs px-3 py-1 rounded-full">
              Galerie active
            </span>
          </div>
        </div>
      </div>

      {/* STAYS */}
      <div className="max-w-5xl mx-auto space-y-12">
        {bookings.map((booking) => {

          const photosForBooking = photos
            .filter((p) => p.bookingId === booking.id)
            .sort((a, b) => {
              const da = a.createdAt?.seconds || 0;
              const db = b.createdAt?.seconds || 0;
              return db - da;
            });

          const now = new Date();
          const isCurrent =
            now >= new Date(booking.dateDebut) &&
            now <= new Date(booking.dateFin);

          return (
            <div key={booking.id} className="bg-white rounded-3xl shadow-lg p-8">

              {/* HEADER */}
              <div className="flex flex-col md:flex-row justify-between md:items-center mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-purple-900">
                    {booking.dateDebut} → {booking.dateFin}
                  </h3>
                  <p className="text-gray-600">
                    {booking.nombreNuits} nuits
                  </p>
                </div>

                <div className="flex items-center gap-4 mt-4 md:mt-0">
                  {isCurrent && (
                    <span className="bg-green-100 text-green-700 px-4 py-1 rounded-full text-sm font-medium">
                      Séjour en cours
                    </span>
                  )}

                  <span className="text-purple-700 font-medium">
                    📸 {photosForBooking.length} photo{photosForBooking.length > 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              {/* GALLERY */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {photosForBooking.map((photo) => {

                  const created =
                    photo.createdAt?.seconds
                      ? new Date(photo.createdAt.seconds * 1000)
                      : new Date(photo.createdAt);

                  const isNew =
                    (Date.now() - created.getTime()) <
                    24 * 60 * 60 * 1000;

                  return (
                    <div
                      key={photo.id}
                      className="group relative rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300"
                    >
                      {isNew && (
                        <span className="absolute top-3 left-3 bg-pink-500 text-white text-xs px-3 py-1 rounded-full shadow z-10">
                          Nouvelle
                        </span>
                      )}

                      <img
                        src={photo.imageUrl}
                        alt="photo"
                        onClick={() => setActiveImage(photo.imageUrl)}
                        className="rounded-2xl cursor-pointer transform group-hover:scale-105 transition duration-300"
                      />

                      {photo.caption && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-sm p-3 opacity-0 group-hover:opacity-100 transition">
                          {photo.caption}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL */}
      {activeImage && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl w-full">
            <button
              onClick={() => setActiveImage(null)}
              className="absolute top-4 right-4 bg-white text-purple-700 px-4 py-2 rounded-full shadow-md"
            >
              ✕
            </button>

            <img
              src={activeImage}
              alt="Agrandie"
              className="rounded-3xl shadow-2xl max-h-[85vh] mx-auto"
            />
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div className="text-center mt-16 text-sm text-purple-700">
        Merci pour votre confiance 🤍 <br />
        Comme à la maison by Angèle
      </div>
    </div>
  );
}