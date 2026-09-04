"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

type Inquiry = { id: string; name: string; email: string; phone?: string; pet?: string; dates?: string; message: string; status: "nouvelle" | "contactée" | "archivée" };
export default function RequestsPage() {
  const [items, setItems] = useState<Inquiry[]>([]); const [loading, setLoading] = useState(true);
  const load = async () => { setLoading(true); const snapshot = await getDocs(collection(db, "inquiries")); setItems(snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as Inquiry)).sort((a, b) => (a.status === "nouvelle" ? -1 : 1))); setLoading(false); };
  useEffect(() => { load(); }, []);
  const setStatus = async (id: string, status: Inquiry["status"]) => { await updateDoc(doc(db, "inquiries", id), { status }); setItems((current) => current.map((item) => item.id === id ? { ...item, status } : item)); };
  return <div className="space-y-8"><header className="page-intro"><div><p className="eyebrow">Premier contact</p><h1>Les demandes de garde.</h1><p>Les nouvelles demandes arrivent ici, prêtes à être traitées en douceur.</p></div><span className="page-count">{items.filter((item) => item.status === "nouvelle").length} nouvelle{items.filter((item) => item.status === "nouvelle").length > 1 ? "s" : ""}</span></header><section className="space-y-3">{loading && <div className="empty-state">Chargement des demandes…</div>}{items.map((item) => <article key={item.id} className="request-card"><div className="flex-1"><div className="flex flex-wrap items-center gap-2"><h2>{item.name}</h2><span className={`request-status ${item.status}`}>{item.status}</span></div><p className="mt-2 text-sm text-[#4e6258]"><b>{item.pet || "Compagnon à préciser"}</b>{item.dates && ` · ${item.dates}`}</p><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#718078]">{item.message}</p><div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold text-[#315e4e]"><a href={`mailto:${item.email}`}>Écrire à {item.email}</a>{item.phone && <a href={`tel:${item.phone}`}>Appeler {item.phone}</a>}</div></div><div className="flex gap-2"><button onClick={() => setStatus(item.id, "contactée")} className="request-action">Contactée</button><button onClick={() => setStatus(item.id, "archivée")} className="request-action">Archiver</button></div></article>)}{!loading && !items.length && <div className="empty-state">Aucune demande pour le moment.</div>}</section></div>;
}
