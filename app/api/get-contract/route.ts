import { NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"

export async function POST(req: Request) {
  try {
    const { token } = await req.json()

    if (!token) {
      return NextResponse.json({ error: "Token manquant" }, { status: 400 })
    }

    const snapshot = await adminDb
      .collection("contracts")
      .where("token", "==", token)
      .get()

    if (snapshot.empty) {
      return NextResponse.json({ error: "Contrat introuvable" }, { status: 404 })
    }

    const doc = snapshot.docs[0]

    return NextResponse.json({
      id: doc.id,
      ...doc.data(),
    })

  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}