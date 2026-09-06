import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { transporter } from "@/lib/mailer";

async function ownerFor(request: Request) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const user = await adminAuth.verifyIdToken(token);
  const email = user.email?.toLowerCase();
  if (!email) return null;
  const owners = await adminDb.collection("owners").get();
  return owners.docs.find((item) => String(item.data().email || "").toLowerCase() === email) || null;
}

export async function POST(request: Request) {
  try {
    const owner = await ownerFor(request);
    if (!owner) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    const body = await request.json();
    const nom = String(body.nom || "").trim().slice(0, 100);
    if (!nom) return NextResponse.json({ error: "INVALID" }, { status: 400 });
    const pet = { nom, type: String(body.type || "chien").slice(0, 40), race: String(body.race || "").slice(0, 120), dateNaissance: String(body.dateNaissance || ""), notes: String(body.notes || "").slice(0, 1000) };
    const requestDoc = await adminDb.collection("clientRequests").add({ ownerId: owner.id, type: "ajout_animal", pet, statut: "nouvelle", createdAt: new Date() });
    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) await transporter.sendMail({ from: `"CALM by Angèle" <${process.env.GMAIL_USER}>`, to: process.env.GMAIL_USER, subject: `Nouveau compagnon à valider · ${nom}`, text: `Une famille a demandé l’ajout de ${nom} à son espace. Ouvrez les demandes de l’espace équipe pour valider sa fiche. Référence : ${requestDoc.id}` });
    return NextResponse.json({ ok: true });
  } catch (error) { console.error("Client pet request failed", error); return NextResponse.json({ error: "SERVER" }, { status: 500 }); }
}
