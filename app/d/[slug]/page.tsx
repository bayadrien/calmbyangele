"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Booking = { id: string; dateDebut: string; dateFin: string; nombreNuits?: number };
type Photo = { id: string; bookingId: string; imageUrl: string; caption: string; createdAt: string | null };
type Gallery = { dog: { nom: string; race: string; dateNaissance: string; photoProfil: string | null }; bookings: Booking[]; photos: Photo[] };

export default function DogPublicPage() {
  const { slug } = useParams<{ slug: string }>();
  const [code, setCode] = useState("");
  const [gallery, setGallery] = useState<Gallery | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState<string | null>(null);

  const loadGallery = async () => {
    const response = await fetch(`/api/gallery/${encodeURIComponent(slug)}`, { cache: "no-store" });
    if (!response.ok) return false;
    setGallery(await response.json());
    return true;
  };

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadGallery().finally(() => setLoading(false)); }, 0);
    return () => window.clearTimeout(timer);
  }, [slug]);

  const unlock = async () => {
    setError("");
    const response = await fetch("/api/gallery/access", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug, code }) });
    if (!response.ok) return setError("Code incorrect ou galerie indisponible.");
    setLoading(true);
    const loaded = await loadGallery();
    if (!loaded) setError("Impossible de charger la galerie.");
    setLoading(false);
  };

  if (loading) return <main className="min-h-screen grid place-items-center bg-purple-100 text-purple-900">Chargement…</main>;
  if (!gallery) return <main className="min-h-screen grid place-items-center bg-purple-100 px-6"><section className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-xl"><h1 className="text-2xl font-bold text-purple-900">Galerie privée</h1><p className="mt-3 text-gray-600">Saisissez le code reçu par e-mail pour accéder aux souvenirs du séjour.</p><input aria-label="Code d’accès" type="password" value={code} onChange={(event) => setCode(event.target.value)} onKeyDown={(event) => event.key === "Enter" && unlock()} className="mt-6 w-full rounded-xl border border-purple-300 p-3" />{error && <p className="mt-3 text-sm text-red-600" role="alert">{error}</p>}<button onClick={unlock} className="mt-5 w-full rounded-xl bg-purple-700 px-6 py-3 font-medium text-white transition hover:bg-purple-800">Accéder à la galerie</button></section></main>;

  return <main className="min-h-screen bg-gradient-to-b from-purple-100 to-purple-200 px-6 py-12"><header className="mx-auto mb-10 max-w-5xl text-center"><h1 className="text-4xl font-bold text-purple-900">{gallery.dog.nom}</h1><p className="mt-2 text-purple-700">Bienvenue dans son album de séjour 🐾</p></header><section className="mx-auto mb-10 flex max-w-5xl items-center gap-6 rounded-3xl bg-white p-7 shadow-xl">{gallery.dog.photoProfil && <img src={gallery.dog.photoProfil} alt="" className="h-24 w-24 rounded-full object-cover" />}<div><h2 className="text-xl font-semibold text-purple-900">{gallery.dog.nom}</h2><p className="text-gray-600">{gallery.dog.race}</p></div></section><section className="mx-auto max-w-5xl space-y-8">{gallery.bookings.map((booking) => { const photos = gallery.photos.filter((photo) => photo.bookingId === booking.id); return <article key={booking.id} className="rounded-3xl bg-white p-7 shadow-lg"><div className="mb-5 flex flex-wrap justify-between gap-2"><h2 className="font-semibold text-purple-900">Séjour du {booking.dateDebut} au {booking.dateFin}</h2><span className="text-sm text-purple-700">📸 {photos.length} photo{photos.length > 1 ? "s" : ""}</span></div><div className="grid grid-cols-2 gap-4 md:grid-cols-3">{photos.map((photo) => <button key={photo.id} onClick={() => setActiveImage(photo.imageUrl)} className="overflow-hidden rounded-2xl text-left shadow"><img src={photo.imageUrl} alt={photo.caption || "Souvenir du séjour"} className="aspect-square w-full object-cover transition hover:scale-105" />{photo.caption && <p className="p-3 text-sm text-gray-700">{photo.caption}</p>}</button>)}</div>{photos.length === 0 && <p className="text-gray-500">Les premiers souvenirs arriveront bientôt.</p>}</article>; })}</section>{activeImage && <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4" onClick={() => setActiveImage(null)}><img src={activeImage} alt="Photo agrandie" className="max-h-[90vh] max-w-full rounded-2xl" /></div>}</main>;
}
