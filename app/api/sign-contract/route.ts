import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

export async function POST(req: Request) {
  try {
    const { contractId, signatureUrl, contractNumber } = await req.json();

    if (!contractId) {
      return NextResponse.json({ error: "ID manquant" }, { status: 400 });
    }

    await updateDoc(doc(db, "contracts", contractId), {
      statut: "signé",
      signatureUrl,
      contractNumber,
      signedAt: new Date(),
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}