"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

type Item = Record<string, any> & { id: string }; // Firestore records evolve with the care form.
const emptyDog = { nom: "", type: "chien", race: "", dateNaissance: "", ownerId: "", temperament: "", alertesSante: "" };
const icons: Record<string, string> = { chien: "🐶", chat: "🐱", lapin: "🐰", autre: "🐾" };

export default function AnimalsPage() {
  const [owners, setOwners] = useState<Item[]>([]);
  const [dogs, setDogs] = useState<Item[]>([]);
  const [form, setForm] = useState(emptyDog);
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  const load = async () => {
    const [ownerSnap, dogSnap] = await Promise.all([getDocs(collection(db, "owners")), getDocs(collection(db, "dogs"))]);
    setOwners(ownerSnap.docs.map((item) => ({ id: item.id, ...item.data() })) as Item[]);
    const records = await Promise.all(dogSnap.docs.map(async (item) => {
      const contract = await getDocs(query(collection(db, "contracts"), where("dogId", "==", item.id)));
      return { id: item.id, ...item.data(), contract: contract.docs[0]?.data() };
    }));
    setDogs(records as Item[]);
  };
  useEffect(() => { load(); }, []);
  const ownerName = (id: string) => { const owner = owners.find((item) => item.id === id); return owner ? `${owner.prenom || ""} ${owner.nom || ""}`.trim() || "Famille sans nom" : "Famille non attribuée"; };
  const filtered = dogs.filter((dog) => `${dog.nom || ""} ${dog.race || ""} ${ownerName(dog.ownerId)}`.toLowerCase().includes(search.toLowerCase()));
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setNotice("");
    try {
      const token = await auth.currentUser?.getIdToken(); const response = await fetch("/api/admin/pets", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(form) }); const result = await response.json().catch(() => ({})); if (!response.ok) throw new Error(result.error || "CREATE_FAILED");
      await load(); setForm(emptyDog); setNotice(result.emailSent ? "La fiche et le contrat initial sont créés. La famille a reçu un e-mail pour compléter la fiche et signer." : "La fiche et le contrat initial sont créés. L’e-mail n’a pas pu être envoyé : vous pouvez transmettre les liens depuis la fiche.");
    } catch { setNotice("Impossible de créer cette fiche pour le moment."); }
    finally { setSaving(false); }
  };

  return <div className="space-y-8">
    <header className="page-intro"><div><p className="eyebrow">Dossiers animaux</p><h1>Chaque compagnon a son univers.</h1><p>Préparez les séjours avec une fiche complète : santé, habitudes, documents, famille et souvenirs.</p></div><button onClick={() => { setAdding(true); setNotice(""); }} className="calm-primary">+ Ajouter un animal</button></header>
    <section className="directory-toolbar pet-toolbar"><div><strong>{dogs.length}</strong><span>compagnon{dogs.length > 1 ? "s" : ""} suivi{dogs.length > 1 ? "s" : ""}</span><input className="directory-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un animal ou une famille…" aria-label="Rechercher un animal" /></div></section>
    <section className="animal-grid">{filtered.map((dog) => <article className="animal-card" key={dog.id}><div className="animal-card-top"><span className="animal-icon">{icons[dog.type] || icons.autre}</span><div className="min-w-0 flex-1"><p className="eyebrow">{dog.type || "animal"}</p><h2>{dog.nom || "Sans nom"}</h2><p>{dog.race || "Race à renseigner"}</p></div>{dog.contract?.statut === "signé" ? <span className="status-pill status-good">Contrat signé</span> : dog.contract ? <span className="status-pill status-wait">Contrat à signer</span> : <span className="status-pill">À préparer</span>}</div><div className="animal-owner"><span>♡</span><div><small>Sa famille</small><b>{ownerName(dog.ownerId)}</b></div></div><div className="animal-tags">{dog.temperament && <span>{dog.temperament}</span>}{dog.alertesSante && <span className="health-tag">! Santé à surveiller</span>}</div><Link href={`/dashboard/dogs/${dog.id}`} className="animal-open">Ouvrir la fiche complète <span>→</span></Link></article>)}{!filtered.length && <div className="empty-state owner-empty">{dogs.length ? "Aucun compagnon ne correspond à cette recherche." : "Ajoutez votre premier compagnon pour créer son dossier complet."}</div>}</section>
    {adding && <div className="modal-backdrop" role="presentation"><section className="editor-sheet" role="dialog" aria-modal="true" aria-label="Ajouter un animal"><div className="editor-heading"><div><p className="eyebrow">Nouveau compagnon</p><h2>Créer sa fiche</h2><p>Les informations essentielles aujourd’hui ; tout le reste sera modifiable dans sa fiche.</p></div><button onClick={() => setAdding(false)} className="sheet-close" aria-label="Fermer">×</button></div><form onSubmit={submit} className="calm-form-grid"><label><span>Type d’animal</span><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="chien">🐶 Chien</option><option value="chat">🐱 Chat</option><option value="lapin">🐰 Lapin</option><option value="autre">🐾 Autre</option></select></label><label><span>Son prénom</span><input required value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} /></label><label><span>Race ou espèce</span><input value={form.race} onChange={(e) => setForm({ ...form, race: e.target.value })} /></label><label><span>Date de naissance</span><input type="date" value={form.dateNaissance} onChange={(e) => setForm({ ...form, dateNaissance: e.target.value })} /></label><label className="md:col-span-2"><span>Sa famille</span><select required value={form.ownerId} onChange={(e) => setForm({ ...form, ownerId: e.target.value })}><option value="">Choisir une famille</option>{owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.prenom} {owner.nom}</option>)}</select></label><label><span>Tempérament</span><input placeholder="Joueur, réservé, câlin…" value={form.temperament} onChange={(e) => setForm({ ...form, temperament: e.target.value })} /></label><label><span>Alerte santé</span><input placeholder="Allergie, vigilance…" value={form.alertesSante} onChange={(e) => setForm({ ...form, alertesSante: e.target.value })} /></label><div className="editor-actions md:col-span-2"><button type="button" onClick={() => setAdding(false)} className="soft-action">Annuler</button><button disabled={saving} className="calm-primary">{saving ? "Création…" : "Créer le dossier"} <span>→</span></button></div>{notice && <p role="status" className="success-message md:col-span-2">{notice}</p>}</form></section></div>}
  </div>;
}
