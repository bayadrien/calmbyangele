"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, addDoc, getDocs, doc, getDoc } from "firebase/firestore";
import { formatDate } from "@/lib/formatDate";

export default function PhotosPage() {
  const [bookings, setBookings] = useState<any[]>([]); const [selectedBooking, setSelectedBooking] = useState(""); const [caption, setCaption] = useState(""); const [category, setCategory] = useState("moment"); const [uploading, setUploading] = useState(false); const [selectedFile, setSelectedFile] = useState<File | null>(null); const [previewUrl, setPreviewUrl] = useState<string | null>(null); const [photoCount, setPhotoCount] = useState(0);
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
  const fetchBookings = async () => setBookings(await Promise.all((await getDocs(collection(db, "bookings"))).docs.map(async (bookingDoc) => { const booking = { id: bookingDoc.id, ...(bookingDoc.data() as any) }; const dogSnap = await getDoc(doc(db, "dogs", booking.dogId)); return { ...booking, dogName: dogSnap.exists() ? dogSnap.data().nom : "Animal inconnu" }; })));
  useEffect(() => { fetchBookings(); }, []);
  useEffect(() => { if (!selectedBooking) { setPhotoCount(0); return; } getDocs(collection(db, "photos")).then((snapshot) => setPhotoCount(snapshot.docs.filter((photo) => photo.data().bookingId === selectedBooking).length)); }, [selectedBooking]);
  const chooseFile = (file?: File) => { if (!file) return; setSelectedFile(file); setPreviewUrl(URL.createObjectURL(file)); };
  const handleUpload = async () => {
    if (!selectedBooking) return alert("Choisissez le séjour auquel rattacher ce souvenir."); if (!selectedFile) return alert("Choisissez une photo avant de continuer."); setUploading(true);
    try { const formData = new FormData(); formData.append("file", selectedFile); formData.append("upload_preset", "calm_unsigned"); const data = await (await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: formData })).json(); await addDoc(collection(db, "photos"), { bookingId: selectedBooking, imageUrl: data.secure_url, caption: caption || "", category, createdAt: new Date() });
      const bookingSnap = await getDoc(doc(db, "bookings", selectedBooking)); if (bookingSnap.exists()) { const booking = bookingSnap.data(); const dogSnap = await getDoc(doc(db, "dogs", booking.dogId)); if (dogSnap.exists() && dogSnap.data().galleryEnabled) { const dog = dogSnap.data(); const ownerSnap = await getDoc(doc(db, "owners", dog.ownerId)); if (ownerSnap.exists()) { const owner = ownerSnap.data(); await fetch("/api/notify-client/gallery-update", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${await auth.currentUser?.getIdToken()}` }, body: JSON.stringify({ dogId: booking.dogId, dogName: dog.nom, ownerName: `${owner.prenom} ${owner.nom}`, ownerEmail: owner.email, galleryUrl: `${process.env.NEXT_PUBLIC_APP_URL}/d/${dog.slug}`, imageUrl: data.secure_url }) }); } } }
      setCaption(""); setSelectedFile(null); setPreviewUrl(null); setPhotoCount((count) => count + 1); alert("Le souvenir a bien été ajouté à la galerie.");
    } catch { alert("La photo n’a pas pu être ajoutée. Réessayez dans un instant."); } finally { setUploading(false); }
  };
  return <div className="space-y-8"><header className="page-intro"><div><p className="eyebrow">Les souvenirs</p><h1>Un séjour se raconte aussi en images.</h1><p>Ajoutez une attention visuelle à la galerie privée de chaque compagnon.</p></div></header>
    <section className="calm-panel max-w-4xl"><div className="section-heading"><div><p className="eyebrow">Nouvelle image</p><h2>Créer un souvenir</h2></div>{selectedBooking && <span className="page-count">{photoCount} photo{photoCount > 1 ? "s" : ""}</span>}</div>
      <label className="calm-label">Séjour concerné<select value={selectedBooking} onChange={(event) => setSelectedBooking(event.target.value)}><option value="">Choisir un séjour</option>{bookings.map((booking) => <option key={booking.id} value={booking.id}>{booking.dogName} · {formatDate(booking.dateDebut)} — {formatDate(booking.dateFin)}</option>)}</select></label>
      <label className="calm-label mt-5">Ce moment raconte…<select value={category} onChange={(event) => setCategory(event.target.value)}><option value="balade">Une balade</option><option value="jeu">Un jeu</option><option value="repas">Un repas</option><option value="repos">Un moment de repos</option><option value="moment">Un joli moment</option></select></label>
      <label className="upload-well mt-5"><input type="file" accept="image/*" hidden onChange={(event) => chooseFile(event.target.files?.[0])} /><span className="upload-icon">◈</span><strong>{selectedFile ? "Changer de photo" : "Choisir une photo"}</strong><small>JPG, PNG ou HEIC · une image à la fois</small></label>
      {selectedFile && <div className="mt-4 flex items-center justify-between rounded-2xl bg-[#f1f5ef] px-4 py-3 text-sm text-[#40584d]"><span className="truncate">{selectedFile.name}</span><button onClick={() => { setSelectedFile(null); setPreviewUrl(null); }} className="text-[#a95537]">Retirer</button></div>}
      {previewUrl && <img src={previewUrl} alt="Aperçu de la photo" className="mt-5 max-h-80 w-full rounded-2xl object-cover" />}
      <label className="calm-label mt-5">Un petit mot <span className="label-optional">facultatif</span><textarea rows={3} placeholder="Par exemple : première balade au soleil…" value={caption} onChange={(event) => setCaption(event.target.value)} /></label>
      <button onClick={handleUpload} disabled={uploading} className="calm-primary mt-6 w-full disabled:opacity-50">{uploading ? "Ajout en cours…" : "Ajouter à la galerie"} <span>→</span></button>
    </section>
  </div>;
}
