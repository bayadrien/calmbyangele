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
      formData,
      detailChangements,
    } = await req.json();

if (!contractId) {
return NextResponse.json({ error: "ID manquant" }, { status: 400 });
}

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

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("SIGN STAY ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}