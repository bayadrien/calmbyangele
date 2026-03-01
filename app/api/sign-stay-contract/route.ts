import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const {
      contractId,
      bookingId,
      dogId,
      pdfUrl,
      signatureUrl,
      changements,
      detailChangements,
    } = await req.json();

    await adminDb.collection("stayContracts").doc(contractId).update({
      statut: "signé",
      signatureUrl,
      pdfUrl,
      signedAt: new Date(),
      changements,
      detailChangements,
    });

    await adminDb.collection("bookings").doc(bookingId).update({
      stayContractStatut: "signé",
    });

    await adminDb.collection("dogs").doc(dogId).update({
      sejourPdfs: [
        {
          url: pdfUrl,
          date: new Date(),
          stayContractId: contractId,
        },
      ],
    });

    await adminDb.collection("documents").add({
      animalId: dogId,
      fileUrl: pdfUrl,
      fileName: "Avenant séjour",
      category: "Contrat",
      createdAt: new Date(),
    });

// ==========================
// 📩 ENVOI MAIL ADMIN
// ==========================

await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notify-admin/contract-avenant`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    type: "avenant",
    dogName: (await adminDb.collection("dogs").doc(dogId).get()).data()?.nom,
    ownerName: "Propriétaire", // si tu veux on peut récupérer le vrai nom
    dateDebut: (await adminDb.collection("stayContracts").doc(contractId).get()).data()?.dateDebut,
    dateFin: (await adminDb.collection("stayContracts").doc(contractId).get()).data()?.dateFin,
    prix: (await adminDb.collection("stayContracts").doc(contractId).get()).data()?.prix,
  }),
});

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("SIGN STAY ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}