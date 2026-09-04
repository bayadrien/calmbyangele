import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const {
      contractId,
      signatureUrl,
      contractNumber,
      pdfUrl,
      formData,
      token,
    } = await req.json();

    if (!contractId || !token) {
      return NextResponse.json({ error: "ID manquant" }, { status: 400 });
    }

    const contract = await adminDb.collection("contracts").doc(contractId).get();
    if (!contract.exists || contract.data()?.token !== token) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }
    if (contract.data()?.statut === "signé") {
      return NextResponse.json({ error: "Contrat déjà signé" }, { status: 409 });
    }

    await contract.ref.update({
      statut: "signé",
      signatureUrl,
      contractNumber,
      pdfUrl,
      formData,
      signedAt: new Date(),
    });

    // Optionnel : marquer le propriétaire comme validé
    const ownerIdFromContract = contract.data()?.ownerId;
    if (ownerIdFromContract) {
      await adminDb.collection("owners").doc(ownerIdFromContract).update({
        contratGeneralValide: true,
      });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("SIGN CONTRACT ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
