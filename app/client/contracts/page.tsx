"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from "react";
import Link from "next/link";
import { auth } from "@/lib/firebase";

type Contract = Record<string, any> & { id: string; kind: "initial" | "stay" };

const asDate = (value: any) => {
  if (!value) return "Date non renseignée";
  const date = value?.seconds ? new Date(value.seconds * 1000) : new Date(value);
  return Number.isNaN(date.getTime()) ? "Date non renseignée" : date.toLocaleDateString("fr-FR");
};

export default function ClientContracts() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [dogs, setDogs] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch("/api/client/portal", { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) return;
      const data = await response.json();
      setDogs(data.dogs || []);
      setBookings(data.bookings || []);
      setContracts([...(data.contracts || []).map((item: any) => ({ ...item, kind: "initial" })), ...(data.stayContracts || []).map((item: any) => ({ ...item, kind: "stay" }))]);
    };
    void load();
  }, []);

  const dogName = (id: string) => dogs.find((dog) => dog.id === id)?.nom || "Votre compagnon";
  const bookingFor = (contract: Contract) => bookings.find((booking) => booking.id === contract.bookingId);

  return <main className="public-calm min-h-screen p-5 pb-28 sm:p-8">
    <header className="mx-auto flex max-w-4xl justify-between"><Link href="/client" className="brand"><span>♧</span><b>CALM <em>by Angèle</em></b></Link><Link href="/client" className="marketing-login">Mon espace</Link></header>
    <section className="mx-auto mt-10 max-w-4xl"><p className="eyebrow">Mes contrats</p><h1 className="gallery-title">Vos documents, en détail.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[#68776e]">Retrouvez chaque contrat, le séjour auquel il se rapporte, sa signature et le document à consulter.</p>
      <div className="mt-7 space-y-4">{contracts.map((contract) => {
        const booking = bookingFor(contract);
        const signed = contract.statut === "signé";
        const title = contract.kind === "initial" ? `Contrat initial · ${dogName(contract.dogId)}` : `Séjour de ${dogName(contract.dogId)}`;
        const subtitle = contract.kind === "initial" ? "Document général pour l’accueil de votre compagnon." : `Du ${asDate(contract.dateDebut || booking?.dateDebut)} au ${asDate(contract.dateFin || booking?.dateFin)}`;
        const action = contract.pdfUrl ? contract.pdfUrl : contract.kind === "stay" ? `/contrat-sejour/${contract.token}` : `/contrat/${contract.token}`;
        return <article className="client-contract-card" key={contract.id}>
          <div className={contract.kind === "stay" ? "client-contract-icon stay" : "client-contract-icon"}>{contract.kind === "stay" ? "□" : "✦"}</div>
          <div className="client-contract-main"><p className="eyebrow">{contract.kind === "stay" ? "Contrat de séjour" : "Contrat initial"}</p><h2>{contract.contractNumber || title}</h2><p>{subtitle}</p>{contract.kind === "stay" && <div className="client-contract-details"><span>{booking?.typePrestation || "Garde"}</span>{booking?.heureArrivee && <span>Arrivée : {booking.heureArrivee}</span>}{booking?.heureDepart && <span>Départ : {booking.heureDepart}</span>}{(contract.prix || booking?.prix) && <span>{contract.prix || booking?.prix} €</span>}</div>}<div className="client-contract-status"><span className={signed ? "signed" : "pending"}>{signed ? "✓ Signé" : "À signer"}</span><span>{signed ? `Signé le ${asDate(contract.signedAt)}` : "En attente de votre signature"}</span></div></div>
          <Link className="client-contract-action" href={action} target={contract.pdfUrl ? "_blank" : undefined}>{contract.pdfUrl ? "Consulter le PDF" : signed ? "Ouvrir le contrat" : "Lire et signer"} <span>→</span></Link>
        </article>;
      })}</div>
      {!contracts.length && <p className="empty-state mt-7">Aucun contrat disponible pour le moment.</p>}
    </section>
  </main>;
}
