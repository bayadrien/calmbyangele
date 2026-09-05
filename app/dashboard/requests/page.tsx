"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";

type Inquiry = { id: string; name: string; email: string; phone?: string; pet?: string; dates?: string; message: string; status: "nouvelle" | "contactée" | "archivée" };
type ClientRequest = { id: string; ownerId: string; dogId: string; dateDebut: string; dateFin: string; typePrestation: string; notes?: string; statut: string };
type Operations = { requests: ClientRequest[]; owners: any[]; dogs: any[] };

export default function RequestsPage() {
  const [items, setItems] = useState<Inquiry[]>([]);
  const [clientRequests, setClientRequests] = useState<ClientRequest[]>([]);
  const [operations, setOperations] = useState<Operations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const token = async () => auth.currentUser?.getIdToken(true);
  const load = async () => {
    setLoading(true); setError("");
    try {
      const idToken = await token();
      if (!idToken) throw new Error();
      const headers = { Authorization: `Bearer ${idToken}` };
      const [inquiriesResponse, operationsResponse] = await Promise.all([fetch("/api/inquiries/admin", { headers, cache: "no-store" }), fetch("/api/admin/client-operations", { headers, cache: "no-store" })]);
      if (!inquiriesResponse.ok || !operationsResponse.ok) throw new Error();
      const [inquiries, clientData] = await Promise.all([inquiriesResponse.json(), operationsResponse.json()]);
      setItems(inquiries.items.sort((a: Inquiry, b: Inquiry) => (a.status === "nouvelle" ? -1 : 1)));
      setOperations(clientData);
      setClientRequests([...clientData.requests].sort((a: ClientRequest, b: ClientRequest) => (a.statut === "nouvelle" ? -1 : 1)));
    } catch { setError("Impossible de charger les demandes pour le moment. Vérifiez que vous êtes connectée avec le compte équipe."); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);
  const setStatus = async (id: string, status: Inquiry["status"]) => {
    try {
      const idToken = await token(); const response = await fetch("/api/inquiries/admin", { method: "PATCH", headers: { "Content-Type": "application/json", ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}) }, body: JSON.stringify({ id, status }) });
      if (!response.ok) throw new Error(); setItems((current) => current.map((item) => item.id === id ? { ...item, status } : item));
    } catch { setError("La demande n’a pas pu être mise à jour."); }
  };
  const setClientStatus = async (id: string, status: string) => {
    try {
      const idToken = await token(); const response = await fetch("/api/admin/client-operations", { method: "PATCH", headers: { "Content-Type": "application/json", ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}) }, body: JSON.stringify({ type: "request", id, status }) });
      if (!response.ok) throw new Error(); setClientRequests((current) => current.map((item) => item.id === id ? { ...item, statut: status } : item));
    } catch { setError("La demande client n’a pas pu être mise à jour."); }
  };
  const dogName = (id: string) => operations?.dogs.find((dog: any) => dog.id === id)?.nom || "Compagnon";
  const familyName = (id: string) => { const owner = operations?.owners.find((item: any) => item.id === id); return owner ? `${owner.prenom || ""} ${owner.nom || ""}`.trim() : "Famille"; };
  const newCount = items.filter((item) => item.status === "nouvelle").length + clientRequests.filter((item) => item.statut === "nouvelle").length;
  return <div className="space-y-8"><header className="page-intro"><div><p className="eyebrow">Toutes les entrées</p><h1>Les demandes de garde.</h1><p>Les demandes du site public et celles faites depuis les comptes clients arrivent maintenant ici.</p></div><button type="button" onClick={() => void load()} className="request-action">Actualiser</button><span className="page-count">{newCount} nouvelle{newCount > 1 ? "s" : ""}</span></header>{loading && <div className="empty-state">Chargement des demandes…</div>}{error && <div className="empty-state">{error}</div>}<section className="space-y-3"><div className="section-heading"><div><p className="eyebrow">Comptes clients</p><h2>Demandes envoyées par les familles</h2></div></div>{clientRequests.map((item) => <article key={item.id} className="request-card"><div className="flex-1"><div className="flex flex-wrap items-center gap-2"><h2>{dogName(item.dogId)}</h2><span className={`request-status ${item.statut || "nouvelle"}`}>{item.statut || "nouvelle"}</span></div><p className="mt-2 text-sm text-[#4e6258]"><b>{familyName(item.ownerId)}</b> · Du {item.dateDebut} au {item.dateFin} · {item.typePrestation}</p>{item.notes && <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#718078]">{item.notes}</p>}</div><div className="flex gap-2"><button onClick={() => void setClientStatus(item.id, "acceptée")} className="request-action">Accepter</button><button onClick={() => void setClientStatus(item.id, "refusée")} className="request-action">Refuser</button></div></article>)}{!loading && !clientRequests.length && !error && <div className="empty-state">Aucune demande depuis un compte client pour le moment.</div>}</section><section className="space-y-3"><div className="section-heading"><div><p className="eyebrow">Site public</p><h2>Premiers contacts</h2></div></div>{items.map((item) => <article key={item.id} className="request-card"><div className="flex-1"><div className="flex flex-wrap items-center gap-2"><h2>{item.name}</h2><span className={`request-status ${item.status}`}>{item.status}</span></div><p className="mt-2 text-sm text-[#4e6258]"><b>{item.pet || "Compagnon à préciser"}</b>{item.dates && ` · ${item.dates}`}</p><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#718078]">{item.message}</p><div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold text-[#315e4e]"><a href={`mailto:${item.email}`}>Écrire à {item.email}</a>{item.phone && <a href={`tel:${item.phone}`}>Appeler {item.phone}</a>}</div></div><div className="flex gap-2"><button onClick={() => void setStatus(item.id, "contactée")} className="request-action">Contactée</button><button onClick={() => void setStatus(item.id, "archivée")} className="request-action">Archiver</button></div></article>)}{!loading && !items.length && !error && <div className="empty-state">Aucune demande depuis le site public pour le moment.</div>}</section></div>;
}
