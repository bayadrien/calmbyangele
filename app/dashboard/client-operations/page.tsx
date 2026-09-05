"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

type Operations = { requests: any[]; messages: any[]; bookings: any[]; owners: any[]; dogs: any[] };
const requestLabel: Record<string, string> = { nouvelle: "Nouvelle", acceptée: "Acceptée", liste_attente: "En attente", refusée: "Refusée" };

export default function ClientOperations() {
  const [data, setData] = useState<Operations | null>(null);
  const [reply, setReply] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = async (showRefresh = false) => {
    const user = auth.currentUser;
    if (!user) return;
    if (showRefresh) setRefreshing(true);
    setError("");
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/admin/client-operations", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
      if (!response.ok) throw new Error("forbidden");
      setData(await response.json());
    } catch {
      setError("Les demandes n’ont pas pu être chargées. Vérifiez que vous êtes connectée avec le compte équipe.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) { setLoading(false); setError("Connectez-vous avec le compte équipe pour consulter les demandes."); return; }
      void load();
    });
    return unsubscribe;
  }, []);

  const patch = async (body: any) => {
    const token = await auth.currentUser?.getIdToken();
    const response = await fetch("/api/admin/client-operations", { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
    if (!response.ok) { setError("La modification n’a pas été enregistrée."); return; }
    await load();
  };

  const requests = useMemo(() => [...(data?.requests || [])].sort((a, b) => {
    const aTime = a.createdAt?.seconds ? a.createdAt.seconds : new Date(a.createdAt || 0).getTime() / 1000;
    const bTime = b.createdAt?.seconds ? b.createdAt.seconds : new Date(b.createdAt || 0).getTime() / 1000;
    return bTime - aTime;
  }), [data]);
  const name = (id: string) => data?.dogs.find((dog) => dog.id === id)?.nom || "Compagnon";
  const owner = (id: string) => data?.owners.find((item) => item.id === id);

  if (loading) return <div className="empty-state">Chargement des demandes clientes…</div>;
  if (!data) return <div className="space-y-4"><div className="empty-state">{error || "Aucune donnée disponible."}</div><button onClick={() => void load(true)} className="calm-primary">Réessayer <span>↻</span></button></div>;

  return <div className="space-y-8">
    <header className="page-intro"><div><p className="eyebrow">Espace client</p><h1>Piloter les familles.</h1><p>Les nouvelles demandes arrivent ici. Elles sont classées de la plus récente à la plus ancienne.</p></div><button onClick={() => void load(true)} disabled={refreshing} className="soft-action">{refreshing ? "Actualisation…" : "↻ Actualiser"}</button></header>
    {error && <p className="form-error">{error}</p>}
    <section className="calm-panel"><div className="section-heading"><div><p className="eyebrow">Demandes de garde</p><h2>{requests.filter((item) => item.statut === "nouvelle").length} nouvelle{requests.filter((item) => item.statut === "nouvelle").length > 1 ? "s" : ""} demande{requests.filter((item) => item.statut === "nouvelle").length > 1 ? "s" : ""}</h2></div><p>{requests.length} demande{requests.length > 1 ? "s" : ""} au total</p></div><div className="space-y-3">{requests.map((item) => <article key={item.id} className="request-card"><div className="flex-1"><div className="flex flex-wrap items-center gap-2"><b>{name(item.dogId)}</b><span className={`request-status ${item.statut || "nouvelle"}`}>{requestLabel[item.statut] || "Nouvelle"}</span></div><p className="mt-1 text-sm">Du {item.dateDebut} au {item.dateFin} · {item.typePrestation}</p><p className="mt-1 text-xs font-semibold text-[#61736a]">Famille : {owner(item.ownerId)?.prenom || "Client"} {owner(item.ownerId)?.nom || ""}</p>{item.notes && <p className="mt-2 text-sm text-[#68776e]">{item.notes}</p>}</div><div className="flex flex-wrap gap-2"><button onClick={() => void patch({ type: "request", id: item.id, status: "acceptée" })} className="request-action">Accepter</button><button onClick={() => void patch({ type: "request", id: item.id, status: "liste_attente" })} className="request-action">Attente</button><button onClick={() => void patch({ type: "request", id: item.id, status: "refusée" })} className="request-action">Refuser</button></div></article>)}{!requests.length && <div className="empty-state">Aucune demande reçue pour l’instant. Cliquez sur Actualiser après un essai client.</div>}</div></section>
    <section className="calm-panel"><p className="eyebrow">Paiements</p><div className="mt-4 space-y-3">{data.bookings.map((item) => <article key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e0e7df] p-4"><span><b>{name(item.dogId)}</b> · {item.prix || 0} €</span><button onClick={() => void patch({ type: "payment", id: item.id, paid: !item.paidAt, paymentMethod: "manuel" })} className="request-action">{item.paidAt ? "Annuler reçu" : "Marquer reçu"}</button></article>)}</div></section>
    <section className="calm-panel"><p className="eyebrow">Messages clients</p><div className="mt-4 space-y-4">{data.messages.filter((item) => item.sender === "client").map((item) => <article key={item.id} className="rounded-xl bg-[#f2f7f3] p-4"><b>{owner(item.ownerId)?.prenom || "Client"}</b><p className="mt-2 text-sm">{item.text}</p><textarea value={reply[item.ownerId] || ""} onChange={(event) => setReply({ ...reply, [item.ownerId]: event.target.value })} className="calm-control mt-3" placeholder="Répondre…" /><button onClick={() => void patch({ type: "message", ownerId: item.ownerId, text: reply[item.ownerId] })} className="calm-primary mt-2">Envoyer la réponse</button></article>)}</div></section>
  </div>;
}
