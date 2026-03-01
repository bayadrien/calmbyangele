import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const {
      contractId,
      ownerId,
      dogId,
      signatureUrl,
      contractNumber,
      pdfUrl,
      formData,
    } = await req.json();

    if (!contractId) {
      return NextResponse.json({ error: "ID manquant" }, { status: 400 });
    }

    await adminDb.collection("contracts").doc(contractId).update({
      statut: "signé",
      signatureUrl,
      contractNumber,
      pdfUrl,
      formData,
      signedAt: new Date(),
    });

    // Optionnel : marquer le propriétaire comme validé
    if (ownerId) {
      await adminDb.collection("owners").doc(ownerId).update({
        contratGeneralValide: true,
      });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("SIGN CONTRACT ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}