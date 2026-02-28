import { NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"

export async function POST(req: Request) {
  try {
    const { token } = await req.json()
    console.log("PROJECT PROD:", process.env.FIREBASE_PROJECT_ID)
    console.log("TOKEN RECU:", token)
    
    if (!token) {
      return NextResponse.json(
        { error: "Token manquant" },
        { status: 400 }
      )
    }

    const snapshot = await adminDb
      .collection("contracts")
      .where("token", "==", token)
      .get()

    if (snapshot.empty) {
      return NextResponse.json(
        { error: "Contrat introuvable" },
        { status: 404 }
      )
    }

    const docSnap = snapshot.docs[0]

    const contract = {
      id: docSnap.id,
      ...(docSnap.data() as any),
    }

    const ownerSnap = await adminDb
      .collection("owners")
      .doc(contract.ownerId)
      .get()

    const dogSnap = await adminDb
      .collection("dogs")
      .doc(contract.dogId)
      .get()

    return NextResponse.json({
      contract,
      owner: ownerSnap.exists ? { id: ownerSnap.id, ...ownerSnap.data() } : null,
      dog: dogSnap.exists ? { id: dogSnap.id, ...dogSnap.data() } : null,
    })

  } catch (error) {
    console.error("ERREUR API :", error)
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    )
  }
}