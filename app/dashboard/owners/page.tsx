"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { FormEvent, useEffect, useMemo, useState } from "react";
import { addDoc, collection, doc, getDocs, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

type Owner = Record<string, any> & { id: string };
type OwnerForm = { prenom: string; nom: string; email: string; telephone: string; adresse: string; contactUrgence: string; notes: string };
const emptyForm: OwnerForm = { prenom: "", nom: "", email: "", telephone: "", adresse: "", contactUrgence: "", notes: "" };
const fields: Array<[keyof OwnerForm, string, string]> = [["prenom", "Prénom", "text"], ["nom", "Nom", "text"], ["email", "Adresse e-mail", "email"], ["telephone", "Téléphone", "tel"], ["adresse", "Adresse", "text"], ["contactUrgence", "Contact d’urgence", "text"]];

export default function OwnersPage() {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [dogCounts, setDogCounts] = useState<Record<string, number>>({});
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Owner | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [form, setForm] = useState<OwnerForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  const load = async () => {
    const [ownerSnap, dogSnap] = await Promise.all([getDocs(collection(db, "owners")), getDocs(collection(db, "dogs"))]);
    setOwners(ownerSnap.docs.map((item) => ({ id: item.id, ...item.data() })) as Owner[]);
    setDogCounts(dogSnap.docs.reduce<Record<string, number>>((counts, item) => { const ownerId = item.data().ownerId; if (ownerId) counts[ownerId] = (counts[ownerId] || 0) + 1; return counts; }, {}));
  };
  useEffect(() => { load(); }, []);

  const visibleOwners = useMemo(() => owners.filter((owner) => `${owner.prenom || ""} ${owner.nom || ""} ${owner.email || ""} ${owner.telephone || ""}`.toLowerCase().includes(search.toLowerCase())), [owners, search]);
  const openNew = () => { setEditing(null); setForm(emptyForm); setNotice(""); setEditorOpen(true); };
  const openEdit = (owner: Owner) => { setEditing(owner); setForm({ ...emptyForm, ...owner }); setNotice(""); setEditorOpen(true); };
  const close = () => { setEditing(null); setForm(emptyForm); setNotice(""); setEditorOpen(false); };
  const save = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setNotice("");
    try {
      if (editing) await updateDoc(doc(db, "owners", editing.id), form);
      else await addDoc(collection(db, "owners"), form);
      await load();
      setNotice(editing ? "La fiche famille est enregistrée." : "La famille a été ajoutée.");
      if (!editing) setForm(emptyForm);
    } catch { setNotice("Impossible d’enregistrer pour le moment."); }
    finally { setSaving(false); }
  };

  return <div className="space-y-8">
    <header className="page-intro"><div><p className="eyebrow">Répertoire clients</p><h1>Les familles, clairement.</h1><p>Retrouvez leurs coordonnées, leurs animaux et les informations utiles au même endroit.</p></div><button onClick={openNew} className="calm-primary">+ Ajouter une famille</button></header>
    <section className="directory-toolbar"><div><strong>{owners.length}</strong><span>famille{owners.length > 1 ? "s" : ""} suivie{owners.length > 1 ? "s" : ""}</span><input className="directory-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un nom, un e-mail…" aria-label="Rechercher une famille" /></div></section>
    <section className="owner-grid">
      {visibleOwners.map((owner) => <article key={owner.id} className="owner-card">
        <div className="owner-card-top"><span className="avatar owner-avatar">{owner.prenom?.[0] || "?"}{owner.nom?.[0] || ""}</span><div className="min-w-0 flex-1"><p className="eyebrow">Famille</p><h2>{owner.prenom || "Prénom"} {owner.nom || "non renseigné"}</h2><p>{owner.email || "Adresse e-mail non renseignée"}</p></div><button onClick={() => openEdit(owner)} className="soft-action" aria-label={`Modifier ${owner.prenom || "cette famille"}`}>Modifier</button></div>
        <div className="owner-meta"><span>◌ {dogCounts[owner.id] || 0} animal{dogCounts[owner.id] > 1 ? "ux" : ""}</span>{owner.telephone && <a href={`tel:${owner.telephone}`}>☎ {owner.telephone}</a>}</div>
        {(owner.adresse || owner.contactUrgence || owner.notes) && <div className="owner-details">{owner.adresse && <p>⌂ {owner.adresse}</p>}{owner.contactUrgence && <p className="emergency-note">! Urgence : {owner.contactUrgence}</p>}{owner.notes && <p className="owner-note">{owner.notes}</p>}</div>}
        <div className="owner-actions">{owner.telephone && <a href={`tel:${owner.telephone}`}>Appeler</a>}{owner.email && <a href={`mailto:${owner.email}`}>Écrire</a>}<button onClick={() => openEdit(owner)}>Ouvrir et modifier →</button></div>
      </article>)}
      {!visibleOwners.length && <div className="empty-state owner-empty">{owners.length ? "Aucune famille ne correspond à cette recherche." : "Votre répertoire est prêt : ajoutez votre première famille."}</div>}
    </section>
    {editorOpen && <div className="modal-backdrop" role="presentation"><section className="editor-sheet" role="dialog" aria-modal="true" aria-label={editing ? "Modifier une famille" : "Ajouter une famille"}><div className="editor-heading"><div><p className="eyebrow">{editing ? "Fiche famille" : "Nouveau dossier"}</p><h2>{editing ? `${editing.prenom || ""} ${editing.nom || ""}`.trim() || "Modifier la famille" : "Ajouter une famille"}</h2><p>Tous les champs restent modifiables à tout moment.</p></div><button onClick={close} className="sheet-close" aria-label="Fermer">×</button></div><form onSubmit={save} className="calm-form-grid">{fields.map(([key, label, type]) => <label key={key}><span>{label}</span><input required={key === "prenom" || key === "nom"} type={type} value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} /></label>)}<label className="md:col-span-2"><span>Notes privées <i className="label-optional">— uniquement pour l’équipe</i></span><textarea rows={4} placeholder="Préférences, habitudes, éléments à retenir…" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></label><div className="editor-actions md:col-span-2"><button type="button" onClick={close} className="soft-action">Annuler</button><button disabled={saving} className="calm-primary">{saving ? "Enregistrement…" : editing ? "Enregistrer les modifications" : "Créer la fiche"} <span>→</span></button></div>{notice && <p role="status" className="success-message md:col-span-2">{notice}</p>}</form></section></div>}
  </div>;
}
