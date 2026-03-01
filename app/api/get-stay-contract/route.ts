import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json(
        { error: "Token manquant" },
        { status: 400 }
      );
    }

    const snapshot = await adminDb
      .collection("stayContracts")
      .where("token", "==", token)
      .get();

    if (snapshot.empty) {
      return NextResponse.json(
        { error: "Avenant introuvable" },
        { status: 404 }
      );
    }

    const docSnap = snapshot.docs[0];

    const stayContract = {
      id: docSnap.id,
      ...(docSnap.data() as any),
    };

    const ownerSnap = await adminDb
      .collection("owners")
      .doc(stayContract.ownerId)
      .get();

    const dogSnap = await adminDb
      .collection("dogs")
      .doc(stayContract.dogId)
      .get();

    return NextResponse.json({
      stayContract,
      owner: ownerSnap.exists ? { id: ownerSnap.id, ...ownerSnap.data() } : null,
      dog: dogSnap.exists ? { id: dogSnap.id, ...dogSnap.data() } : null,
    });

  } catch (error) {
    console.error("ERREUR STAY API :", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}