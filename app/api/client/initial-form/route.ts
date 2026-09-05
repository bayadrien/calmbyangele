import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", ""); if (!token) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    const user = await adminAuth.verifyIdToken(token); const email = user.email?.toLowerCase(); const owners = await adminDb.collection("owners").get(); const owner = owners.docs.find((item) => String(item.data().email || "").toLowerCase() === email);
    if (!owner) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 }); const body = await request.json(); const dogId = String(body.dogId || ""); const dog = await adminDb.collection("dogs").doc(dogId).get(); if (!dog.exists || dog.data()?.ownerId !== owner.id) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    await adminDb.collection("dogs").doc(dogId).update({ repas: String(body.repas || "").slice(0, 1000), comportement: String(body.comportement || "").slice(0, 1500), alertesSante: String(body.alertesSante || "").slice(0, 1000), traitementDetail: String(body.traitementDetail || "").slice(0, 1000), initialFormCompletedAt: new Date() });
    await adminDb.collection("owners").doc(owner.id).update({ contactUrgence: String(body.contactUrgence || "").slice(0, 300) });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "SERVER" }, { status: 500 }); }
}
