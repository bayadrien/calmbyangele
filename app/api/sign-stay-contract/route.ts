import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: Request) {
  try {
    const {
      contractId,
      pdfUrl,
      signatureUrl,
      changements,
      detailChangements,
      token,
    } = await req.json();

if (!contractId || !token) {
return NextResponse.json({ error: "ID manquant" }, { status: 400 });
}

    const contract = await adminDb.collection("stayContracts").doc(contractId).get();
    if (!contract.exists || contract.data()?.token !== token) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }
    const record = contract.data()!;
    if (record.statut === "signé") return NextResponse.json({ error: "Contrat déjà signé" }, { status: 409 });

    await adminDb.collection("stayContracts").doc(contractId).update({
      statut: "signé",
      signatureUrl,
      pdfUrl,
      signedAt: new Date(),
      changements,
      detailChangements,
    });

    await adminDb.collection("bookings").doc(record.bookingId).update({
      stayContractStatut: "signé",
    });

    await adminDb.collection("dogs").doc(record.dogId).update({
      sejourPdfs: FieldValue.arrayUnion(
        {
          url: pdfUrl,
          date: new Date(),
          stayContractId: contractId,
        },
      ),
    });

    await adminDb.collection("documents").add({
      animalId: record.dogId,
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
