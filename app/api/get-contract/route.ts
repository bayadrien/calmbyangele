import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "Token manquant" }, { status: 400 });
    }

    const q = query(
      collection(db, "contracts"),
      where("token", "==", token)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return NextResponse.json({ error: "Contrat introuvable" }, { status: 404 });
    }

    const contractDoc = snapshot.docs[0];

    return NextResponse.json({
      id: contractDoc.id,
      ...contractDoc.data(),
    });

  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}