"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs } from "firebase/firestore";

const fields = [
  ["prenom", "Prénom", "text"], ["nom", "Nom", "text"], ["email", "Adresse e-mail", "email"],
  ["telephone", "Téléphone", "tel"], ["adresse", "Adresse", "text"], ["contactUrgence", "Contact d’urgence", "text"],
] as const;

export default function OwnersPage() {
  const [owners, setOwners] = useState<any[]>([]);
  const [form, setForm] = useState({ prenom: "", nom: "", email: "", telephone: "", adresse: "", contactUrgence: "", notes: "" });
  const fetchOwners = async () => setOwners((await getDocs(collection(db, "owners"))).docs.map((owner) => ({ id: owner.id, ...owner.data() })));
  useEffect(() => { fetchOwners(); }, []);
  const handleSubmit = async (event: React.FormEvent) => { event.preventDefault(); await addDoc(collection(db, "owners"), form); setForm({ prenom: "", nom: "", email: "", telephone: "", adresse: "", contactUrgence: "", notes: "" }); fetchOwners(); };

  return <div className="space-y-8">
    <header className="page-intro"><div><p className="eyebrow">Les familles</p><h1>Les humains derrière chaque truffe.</h1><p>Centralisez les coordonnées, préférences et informations utiles de vos clients.</p></div><span className="page-count">{owners.length} famille{owners.length > 1 ? "s" : ""}</span></header>
    <section className="calm-panel"><div className="section-heading"><div><p className="eyebrow">Nouveau dossier</p><h2>Ajouter une famille</h2></div><p>Les champs essentiels pour bien démarrer.</p></div>
      <form onSubmit={handleSubmit} className="calm-form-grid">
        {fields.map(([key, label, type]) => <label key={key}><span>{label}</span><input type={type} required={key === "prenom" || key === "nom"} value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} /></label>)}
        <label className="md:col-span-2"><span>Notes privées</span><textarea rows={3} placeholder="Habitudes, informations importantes, préférences…" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></label>
        <button type="submit" className="calm-primary md:col-span-2">Créer la fiche famille <span>→</span></button>
      </form>
    </section>
    <section><div className="section-heading"><div><p className="eyebrow">Répertoire</p><h2>Vos familles</h2></div></div><div className="grid gap-3 md:grid-cols-2">
      {owners.map((owner) => <article key={owner.id} className="directory-card"><span className="avatar">{owner.prenom?.[0] || "?"}{owner.nom?.[0] || ""}</span><div className="min-w-0"><h3>{owner.prenom} {owner.nom}</h3><p>{owner.email || "Adresse e-mail non renseignée"}</p>{owner.telephone && <small>{owner.telephone}</small>}</div><span className="card-arrow">→</span></article>)}
      {!owners.length && <div className="empty-state md:col-span-2">Aucune famille enregistrée. Créez votre première fiche ci-dessus.</div>}
    </div></section>
  </div>;
}
