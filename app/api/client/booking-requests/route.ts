import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { transporter } from "@/lib/mailer";

export async function POST(request: Request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", ""); if (!token) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    const user = await adminAuth.verifyIdToken(token); const email = user.email?.toLowerCase();
    const owners = await adminDb.collection("owners").get(); const owner = owners.docs.find((item) => String(item.data().email || "").toLowerCase() === email);
    if (!owner) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    const body = await request.json(); const dogId = typeof body.dogId === "string" ? body.dogId : ""; const dateDebut = typeof body.dateDebut === "string" ? body.dateDebut : ""; const dateFin = typeof body.dateFin === "string" ? body.dateFin : "";
    if (!dogId || !dateDebut || !dateFin || new Date(dateFin) <= new Date(dateDebut)) return NextResponse.json({ error: "INVALID" }, { status: 400 });
    const dog = await adminDb.collection("dogs").doc(dogId).get(); if (!dog.exists || dog.data()?.ownerId !== owner.id) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    const requestDoc = await adminDb.collection("clientRequests").add({ ownerId: owner.id, dogId, dateDebut, dateFin, typePrestation: String(body.typePrestation || "pension"), heureArrivee: String(body.heureArrivee || ""), heureDepart: String(body.heureDepart || ""), notes: String(body.notes || "").slice(0, 1500), statut: "nouvelle", createdAt: new Date() });
    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) await transporter.sendMail({ from: `"CALM by Angèle" <${process.env.GMAIL_USER}>`, to: process.env.GMAIL_USER, subject: `Nouvelle demande de garde · ${dog.data()?.nom || "compagnon"}`, text: `Demande client reçue pour ${dog.data()?.nom || "un compagnon"}, du ${dateDebut} au ${dateFin}. Référence : ${requestDoc.id}` });
    return NextResponse.json({ ok: true, requestId: requestDoc.id }, { status: 201 });
  } catch (error) { console.error("Client booking request failed", error); return NextResponse.json({ error: "SERVER" }, { status: 500 }); }
}
