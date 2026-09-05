"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";

type RecordItem = Record<string, any> & { id: string };
const petIcons: Record<string, string> = { chien: "🐶", chat: "🐱", lapin: "🐰", autre: "🐾" };
const emptyCare = { nom: "", type: "chien", race: "", dateNaissance: "", sexe: "", sterilise: "", ownerId: "", poids: "", puce: "", temperament: "", comportement: "", repas: "", alertesSante: "", maladies: "", traitementOuiNon: "", traitementDetail: "", veterinaire: "", veterinaireTelephone: "", sociableHumains: "", sociableEnfants: "", sociableChiens: "", sociableChats: "", notes: "", consignes: "" };

export default function PetRecord() {
  const { id } = useParams<{ id: string }>();
  const [pet, setPet] = useState<RecordItem | null>(null);
  const [form, setForm] = useState<Record<string, any>>(emptyCare);
  const [owners, setOwners] = useState<RecordItem[]>([]);
  const [bookings, setBookings] = useState<RecordItem[]>([]);
  const [documents, setDocuments] = useState<RecordItem[]>([]);
  const [contracts, setContracts] = useState<RecordItem[]>([]);
  const [stayContracts, setStayContracts] = useState<RecordItem[]>([]);
  const [tab, setTab] = useState<"fiche" | "historique" | "documents">("fiche");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState("");

  const load = async () => {
    if (!id) return;
    const [petSnap, ownerSnap, bookingSnap, documentSnap, contractSnap, stayContractSnap] = await Promise.all([
      getDoc(doc(db, "dogs", id)), getDocs(collection(db, "owners")),
      getDocs(query(collection(db, "bookings"), where("dogId", "==", id))),
      getDocs(query(collection(db, "documents"), where("animalId", "==", id))),
      getDocs(query(collection(db, "contracts"), where("dogId", "==", id))),
      getDocs(query(collection(db, "stayContracts"), where("dogId", "==", id))),
    ]);
    if (petSnap.exists()) { const data = { id: petSnap.id, ...petSnap.data() } as RecordItem; setPet(data); setForm({ ...emptyCare, ...data }); }
    setOwners(ownerSnap.docs.map((item) => ({ id: item.id, ...item.data() })) as RecordItem[]);
    setBookings(bookingSnap.docs.map((item) => ({ id: item.id, ...item.data() })) as RecordItem[]);
    setDocuments(documentSnap.docs.map((item) => ({ id: item.id, ...item.data() })) as RecordItem[]);
    setContracts(contractSnap.docs.map((item) => ({ id: item.id, ...item.data() })) as RecordItem[]);
    setStayContracts(stayContractSnap.docs.map((item) => ({ id: item.id, ...item.data() })) as RecordItem[]);
  };
  useEffect(() => { void load(); }, [id]);

  const update = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const owner = owners.find((item) => item.id === pet?.ownerId);
  const age = (date?: string) => { if (!date) return "Âge à renseigner"; const years = Math.max(0, new Date().getFullYear() - new Date(date).getFullYear()); return years ? `${years} an${years > 1 ? "s" : ""}` : "Moins d’un an"; };
  const save = async (event: FormEvent) => { event.preventDefault(); if (!pet) return; setSaving(true); setNotice(""); try { await updateDoc(doc(db, "dogs", pet.id), form); setPet({ ...pet, ...form }); setEditing(false); setNotice("Toutes les informations ont été enregistrées."); } catch { setNotice("La sauvegarde n’a pas abouti. Réessayez."); } finally { setSaving(false); } };
  const toggleGallery = async () => { if (!pet) return; const galleryEnabled = !pet.galleryEnabled; await updateDoc(doc(db, "dogs", pet.id), { galleryEnabled }); setPet({ ...pet, galleryEnabled }); };
  const upload = async (event: ChangeEvent<HTMLInputElement>, profile = false) => {
    const file = event.target.files?.[0]; if (!file || !pet) return;
    setUploading(true); setNotice("");
    try {
      const body = new FormData(); body.append("file", file); body.append("upload_preset", "calm_unsigned");
      const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME; const endpoint = `https://api.cloudinary.com/v1_1/${cloud}/${profile ? "image" : "auto"}/upload`;
      const response = await fetch(endpoint, { method: "POST", body }); const uploaded = await response.json();
      if (!uploaded.secure_url) throw new Error("upload");
      if (profile) { await updateDoc(doc(db, "dogs", pet.id), { photoProfil: uploaded.secure_url }); setPet({ ...pet, photoProfil: uploaded.secure_url }); }
      else { await addDoc(collection(db, "documents"), { animalId: pet.id, fileUrl: uploaded.secure_url, fileName: file.name, category: "Document", createdAt: new Date() }); await load(); }
      setNotice(profile ? "La photo de profil est mise à jour." : "Le document a été ajouté.");
    } catch { setNotice("L’envoi n’a pas fonctionné. Réessayez."); } finally { setUploading(false); event.target.value = ""; }
  };
  const removeDocument = async (documentId: string) => { if (!confirm("Supprimer ce document de la fiche ?")) return; await deleteDoc(doc(db, "documents", documentId)); await load(); };
  const totalNights = bookings.reduce((total, booking) => total + (Number(booking.nombreNuits) || 0), 0);
  const totalAmount = bookings.reduce((total, booking) => total + (Number(booking.prix) || 0), 0);
  const displayDate = (value: any) => {
    if (!value) return "Date non renseignée";
    const date = value?.seconds ? new Date(value.seconds * 1000) : new Date(value);
    return Number.isNaN(date.getTime()) ? "Date non renseignée" : date.toLocaleDateString("fr-FR");
  };
  const bookingFor = (contract: RecordItem) => bookings.find((booking) => booking.id === contract.bookingId);

  if (!pet) return <div className="record-loading">Chargement du dossier…</div>;
  const fields: Array<[string, string, "text" | "date" | "select", string[]?]> = [
    ["nom", "Prénom", "text"], ["type", "Type d’animal", "select", ["chien", "chat", "lapin", "autre"]], ["race", "Race ou espèce", "text"], ["dateNaissance", "Date de naissance", "date"], ["sexe", "Sexe", "select", ["Mâle", "Femelle"]], ["sterilise", "Stérilisé / castré", "select", ["Oui", "Non"]], ["poids", "Poids", "text"], ["puce", "Numéro d’identification", "text"], ["temperament", "Tempérament", "text"], ["veterinaire", "Vétérinaire", "text"], ["veterinaireTelephone", "Téléphone vétérinaire", "text"], ["traitementOuiNon", "Traitement en cours", "select", ["Oui", "Non"]], ["sociableHumains", "À l’aise avec les adultes", "select", ["Oui", "Non", "À préciser"]], ["sociableEnfants", "À l’aise avec les enfants", "select", ["Oui", "Non", "À préciser"]], ["sociableChiens", "À l’aise avec les chiens", "select", ["Oui", "Non", "À préciser"]], ["sociableChats", "À l’aise avec chats / NAC", "select", ["Oui", "Non", "À préciser"]],
  ];
  return <div className="record-page">
    <Link href="/dashboard/dogs" className="back-link">← Retour aux animaux</Link>
    <header className="record-hero">
      <div className="record-photo">{pet.photoProfil ? <img src={pet.photoProfil} alt={`Photo de ${pet.nom}`} /> : <span>{petIcons[pet.type] || "🐾"}</span>}<label className="photo-edit">Changer la photo<input type="file" accept="image/*" hidden onChange={(event) => void upload(event, true)} /></label></div>
      <div className="record-title"><p className="eyebrow">Dossier compagnon</p><h1>{pet.nom || "Sans nom"}</h1><p>{pet.race || "Race à renseigner"} · {age(pet.dateNaissance)} · {owner ? `${owner.prenom || ""} ${owner.nom || ""}`.trim() : "Famille à attribuer"}</p><div className="record-badges">{pet.alertesSante && <span className="record-alert">Attention santé</span>}{pet.traitementOuiNon === "Oui" && <span className="record-warm">Traitement en cours</span>}<span className={pet.galleryEnabled ? "record-ok" : "record-muted"}>{pet.galleryEnabled ? "Galerie active" : "Galerie inactive"}</span></div></div>
      <button onClick={() => { setEditing((value) => !value); setForm({ ...emptyCare, ...pet }); }} className="record-edit">{editing ? "Fermer l’édition" : "Modifier la fiche"} <span>✎</span></button>
    </header>
    <nav className="record-tabs"><button className={tab === "fiche" ? "active" : ""} onClick={() => setTab("fiche")}>Fiche complète</button><button className={tab === "historique" ? "active" : ""} onClick={() => setTab("historique")}>Séjours <b>{bookings.length}</b></button><button className={tab === "documents" ? "active" : ""} onClick={() => setTab("documents")}>Documents <b>{documents.length + contracts.length + stayContracts.length}</b></button></nav>
    {notice && <p role="status" className="record-notice">{notice}</p>}
    {tab === "fiche" && <>{editing ? <form onSubmit={save} className="record-editor"><div className="editor-section"><div><p className="eyebrow">Identité</p><h2>Qui est {pet.nom} ?</h2></div><div className="record-fields">{fields.slice(0, 8).map(([key, label, kind, choices]) => <label key={key}><span>{label}</span>{kind === "select" ? <select value={form[key] || ""} onChange={(event) => update(key, event.target.value)}><option value="">À renseigner</option>{choices?.map((choice) => <option key={choice} value={choice}>{choice}</option>)}</select> : <input type={kind} value={form[key] || ""} onChange={(event) => update(key, event.target.value)} />}</label>)}</div></div><div className="editor-section"><div><p className="eyebrow">Santé & quotidien</p><h2>Ses besoins au jour le jour.</h2></div><div className="record-fields"><label className="wide"><span>Repas, quantité, horaires</span><textarea value={form.repas || ""} onChange={(event) => update("repas", event.target.value)} placeholder="Croquettes, quantité, heures, friandises…" /></label><label className="wide"><span>Allergies, santé et points de vigilance</span><textarea value={form.alertesSante || ""} onChange={(event) => update("alertesSante", event.target.value)} placeholder="Allergies, soins, fragilités…" /></label><label className="wide"><span>Antécédents médicaux</span><textarea value={form.maladies || ""} onChange={(event) => update("maladies", event.target.value)} /></label><label className="wide"><span>Détail du traitement</span><textarea value={form.traitementDetail || ""} onChange={(event) => update("traitementDetail", event.target.value)} /></label>{fields.slice(8, 12).map(([key, label, kind, choices]) => <label key={key}><span>{label}</span>{kind === "select" ? <select value={form[key] || ""} onChange={(event) => update(key, event.target.value)}><option value="">À renseigner</option>{choices?.map((choice) => <option key={choice} value={choice}>{choice}</option>)}</select> : <input value={form[key] || ""} onChange={(event) => update(key, event.target.value)} />}</label>)}</div></div><div className="editor-section"><div><p className="eyebrow">Comportement</p><h2>Ses habitudes sociales.</h2></div><div className="record-fields"><label className="wide"><span>Caractère et comportement</span><textarea value={form.comportement || ""} onChange={(event) => update("comportement", event.target.value)} placeholder="Réactions, jeux, sommeil, peurs…" /></label>{fields.slice(12).map(([key, label, kind, choices]) => <label key={key}><span>{label}</span><select value={form[key] || ""} onChange={(event) => update(key, event.target.value)}><option value="">À renseigner</option>{choices?.map((choice) => <option key={choice} value={choice}>{choice}</option>)}</select></label>)}</div></div><div className="editor-section"><div><p className="eyebrow">Consignes équipe</p><h2>Ce qui fait la différence.</h2></div><div className="record-fields"><label className="wide"><span>Consignes de garde</span><textarea value={form.consignes || ""} onChange={(event) => update("consignes", event.target.value)} placeholder="Rituels, consignes d’arrivée, sorties, dodo…" /></label><label className="wide"><span>Notes internes</span><textarea value={form.notes || ""} onChange={(event) => update("notes", event.target.value)} placeholder="Informations réservées à l’équipe CALM" /></label><label className="wide"><span>Sa famille</span><select value={form.ownerId || ""} onChange={(event) => update("ownerId", event.target.value)}><option value="">Choisir une famille</option>{owners.map((item) => <option key={item.id} value={item.id}>{item.prenom} {item.nom}</option>)}</select></label></div></div><div className="record-savebar"><button type="button" onClick={() => { setEditing(false); setForm({ ...emptyCare, ...pet }); }} className="soft-action">Annuler les changements</button><button disabled={saving} className="calm-primary">{saving ? "Enregistrement…" : "Enregistrer toute la fiche"} <span>→</span></button></div></form> : <div className="record-overview"><section className="record-summary"><div><p className="eyebrow">En bref</p><h2>Ses essentiels.</h2></div><div className="summary-grid"><Info label="Famille" value={owner ? `${owner.prenom || ""} ${owner.nom || ""}`.trim() : "À attribuer"} /><Info label="Repas" value={pet.repas || "À renseigner"} /><Info label="Tempérament" value={pet.temperament || pet.comportement || "À renseigner"} /><Info label="Vétérinaire" value={pet.veterinaire || "À renseigner"} /></div></section><section className="record-watch"><div><p className="eyebrow">Vigilance</p><h2>Une attention particulière ?</h2></div><p>{pet.alertesSante || pet.traitementDetail || "Aucun point particulier renseigné pour l’instant."}</p><button onClick={() => setEditing(true)} className="soft-action">Compléter les informations</button></section><section className="record-summary full"><div><p className="eyebrow">Vie à la maison</p><h2>Habitudes & consignes.</h2></div><div className="summary-grid"><Info label="Consignes de garde" value={pet.consignes || "À renseigner"} /><Info label="Sociabilité" value={[`Adultes : ${pet.sociableHumains || "?"}`, `Enfants : ${pet.sociableEnfants || "?"}`, `Chiens : ${pet.sociableChiens || "?"}`].join(" · ")} /><Info label="Notes d’équipe" value={pet.notes || "Aucune note"} /><Info label="Galerie privée" value={pet.galleryEnabled ? "Accessible par la famille" : "Désactivée"} /></div><div className="gallery-control"><div><b>Galerie privée</b><p>Activez-la quand vous souhaitez partager les souvenirs avec la famille.</p></div><button onClick={() => void toggleGallery()} className={pet.galleryEnabled ? "gallery-switch active" : "gallery-switch"} aria-label="Activer ou désactiver la galerie"><span /></button></div></section></div>}</>}
    {tab === "historique" && <section className="record-history"><div className="history-stats"><article><small>Séjours</small><b>{bookings.length}</b></article><article><small>Nuits cumulées</small><b>{totalNights}</b></article><article><small>Total facturé</small><b>{totalAmount} €</b></article></div><div className="history-list">{bookings.map((booking) => <article key={booking.id}><div><p>{booking.dateDebut || "Date à préciser"} <span>→</span> {booking.dateFin || "Date à préciser"}</p><small>{booking.nombreNuits || 0} nuit{Number(booking.nombreNuits) > 1 ? "s" : ""} · {booking.prix || 0} €</small></div>{booking.notes && <p>{booking.notes}</p>}</article>)}{!bookings.length && <div className="empty-state">Aucun séjour enregistré pour ce compagnon.</div>}</div></section>}
    {tab === "documents" && <section className="record-documents">
      <label className="document-drop"><input type="file" hidden onChange={(event) => void upload(event)} /><span>↑</span><b>{uploading ? "Envoi du document…" : "Ajouter un document"}</b><small>Ordonnance, carnet, vaccin, carte d’identification…</small></label>
      <div className="contract-section"><div className="contract-section-heading"><div><p className="eyebrow">Contrats</p><h2>Ce qui est signé et pour quel séjour.</h2></div><p>Chaque document reste consultable ici.</p></div>
        {contracts.map((contract) => <article className="contract-card" key={contract.id}><span className="contract-icon">✦</span><div className="contract-main"><p className="eyebrow">Contrat initial</p><h3>{contract.contractNumber || "Contrat initial de " + pet.nom}</h3><p>Document général du dossier de {pet.nom}.</p><div className="contract-meta"><span>{contract.statut === "signé" ? "✓ Signé" : "En attente de signature"}</span><span>{contract.signedAt ? `Signé le ${displayDate(contract.signedAt)}` : "Pas encore signé"}</span></div></div><div className="contract-actions">{contract.pdfUrl ? <a href={contract.pdfUrl} target="_blank" rel="noreferrer">Consulter le PDF</a> : contract.token ? <Link href={`/contrat/${contract.token}`}>Ouvrir le contrat</Link> : <span>Document indisponible</span>}</div></article>)}
        {stayContracts.map((contract) => { const booking = bookingFor(contract); return <article className="contract-card" key={contract.id}><span className="contract-icon stay">□</span><div className="contract-main"><p className="eyebrow">Contrat de séjour</p><h3>{booking?.typePrestation || "Séjour"} · du {displayDate(contract.dateDebut || booking?.dateDebut)} au {displayDate(contract.dateFin || booking?.dateFin)}</h3><p>{booking?.heureArrivee && `Arrivée : ${booking.heureArrivee}`}{booking?.heureArrivee && booking?.heureDepart && " · "}{booking?.heureDepart && `Départ : ${booking.heureDepart}`}{contract.prix || booking?.prix ? ` · ${contract.prix || booking?.prix} €` : ""}</p><div className="contract-meta"><span>{contract.statut === "signé" ? "✓ Signé" : "En attente de signature"}</span><span>{contract.signedAt ? `Signé le ${displayDate(contract.signedAt)}` : "Pas encore signé"}</span></div></div><div className="contract-actions">{contract.pdfUrl ? <a href={contract.pdfUrl} target="_blank" rel="noreferrer">Consulter le PDF</a> : contract.token ? <Link href={`/contrat-sejour/${contract.token}`}>Ouvrir le contrat</Link> : <span>Document indisponible</span>}</div></article>; })}
        {!contracts.length && !stayContracts.length && <div className="empty-state">Aucun contrat préparé pour le moment.</div>}
      </div>
      {documents.map((item) => <article className="document-row" key={item.id}><span>⌑</span><div><b>{item.fileName || "Document"}</b><small>{item.category || "Document"}</small></div><a href={item.fileUrl} target="_blank" rel="noreferrer">Ouvrir</a><button onClick={() => void removeDocument(item.id)}>Supprimer</button></article>)}
    </section>}
  </div>;
}

function Info({ label, value }: { label: string; value: string }) { return <article><small>{label}</small><p>{value}</p></article>; }
