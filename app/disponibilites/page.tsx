"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Blocked = { start: string; end: string; kind: string };
const format = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });

export default function AvailabilityPage() {
  const [blocked, setBlocked] = useState<Blocked[]>([]);
  useEffect(() => { fetch("/api/availability").then((r) => r.json()).then((data) => setBlocked(data.blocked || [])).catch(() => undefined); }, []);
  const future = blocked.filter((item) => item.end >= new Date().toISOString().slice(0, 10)).sort((a, b) => a.start.localeCompare(b.start));
  return <main className="marketing-page"><header className="marketing-nav"><Link href="/" className="brand"><span>♧</span><b>CALM <em>by Angèle</em></b></Link><Link href="/client/login" className="marketing-client-access">Mon espace client <span>→</span></Link></header><section className="availability-hero"><p className="eyebrow">Avant votre demande</p><h1>Les disponibilités de la maison.</h1><p>Voici les périodes déjà réservées ou indisponibles. Une demande reste nécessaire pour confirmer l’accueil de votre compagnon.</p><Link href="/#demande" className="calm-primary">Faire une demande <span>→</span></Link></section><section className="availability-list"><div><p className="eyebrow">Planning indicatif</p><h2>Les prochaines périodes non disponibles</h2></div>{future.length ? <div className="availability-cards">{future.map((item, index) => <article key={`${item.start}-${index}`}><span>{item.kind === "indisponible" ? "Pause CALM" : "Déjà réservé"}</span><b>Du {format(item.start)} au {format(item.end)}</b><p>{item.kind === "indisponible" ? "La maison ne prend pas de garde pendant cette période." : "Une garde est déjà prévue sur ces dates."}</p></article>)}</div> : <p className="empty-state">Aucune période bloquée pour le moment. Écrivez-nous pour vérifier vos dates.</p>}</section></main>;
}
