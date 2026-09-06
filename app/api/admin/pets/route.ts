import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { transporter } from "@/lib/mailer";
import { requireAdmin } from "@/lib/server-auth";

type Owner = { email?: string; prenom?: string; nom?: string };

async function sendOnboardingEmail(request: Request, owner: Owner, petName: string, token: string) {
  if (!owner.email || !process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) return false;
  const ownerName = `${owner.prenom || ""} ${owner.nom || ""}`.trim() || "Bonjour";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  const initialLink = `${appUrl}/client/initial`;
  const contractLink = `${appUrl}/contrat/${token}`;
  try {
    await transporter.sendMail({
      from: `"CALM by Angèle" <${process.env.GMAIL_USER}>`, to: owner.email,
      subject: `${petName} a été ajouté à votre espace CALM`,
      text: `Bonjour ${ownerName},\n\n${petName} vient d’être ajouté à votre espace famille CALM.\n\nPour préparer son accueil, complétez sa fiche initiale : ${initialLink}\nPuis lisez et signez son contrat initial : ${contractLink}\n\nÀ bientôt,\nCALM by Angèle`,
      html: `<div style="margin:0;background:#f4f5ef;padding:32px 16px;font-family:Arial,sans-serif;color:#274c3e"><main style="max-width:560px;margin:auto;border-radius:24px;background:#fffefa;padding:34px;box-shadow:0 14px 36px rgba(31,58,47,.1)"><div style="text-align:center"><div style="display:inline-block;border-radius:18px;background:#315e4e;padding:15px 18px;color:#fff;font-size:24px">♧</div><h1 style="margin:14px 0 4px;font-family:Georgia,serif">CALM <em style="font-weight:400">by Angèle</em></h1></div><p style="margin-top:28px">Bonjour ${ownerName},</p><h2 style="font-size:24px">${petName} rejoint votre espace famille.</h2><p style="color:#5f7067;line-height:1.65">Son dossier est maintenant prêt. Pour que son accueil soit préparé avec tous ses repères, complétez sa fiche initiale puis signez son contrat.</p><p style="margin:25px 0 12px"><a href="${initialLink}" style="display:inline-block;border-radius:12px;background:#315e4e;padding:14px 18px;color:#fff;text-decoration:none;font-weight:700">Compléter la fiche de ${petName}&nbsp; →</a></p><p style="margin:8px 0"><a href="${contractLink}" style="color:#315e4e;font-weight:700">Lire le contrat initial →</a></p><p style="margin-top:28px;color:#7a8880;font-size:13px;line-height:1.6">Merci de prendre quelques minutes pour renseigner ses habitudes, son alimentation et ses éventuels besoins particuliers.</p></main></div>`,
    });
    console.info("[admin/pets] onboarding email sent", { petName });
    return true;
  } catch (error) {
    console.error("[admin/pets] onboarding email failed", { petName, error: error instanceof Error ? error.message : "Unknown error" });
    return false;
  }
}

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error("[admin/pets] request failed", { error: message });
  return NextResponse.json({ error: message === "UNAUTHORIZED" ? "UNAUTHORIZED" : "CREATE_FAILED" }, { status: message === "UNAUTHORIZED" ? 401 : 500 });
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    const body = await request.json();
    const nom = String(body.nom || "").trim().slice(0, 100);
    const ownerId = String(body.ownerId || "");
    if (!nom || !ownerId) return NextResponse.json({ error: "INVALID" }, { status: 400 });
    const ownerSnapshot = await adminDb.collection("owners").doc(ownerId).get();
    if (!ownerSnapshot.exists) return NextResponse.json({ error: "OWNER_NOT_FOUND" }, { status: 404 });
    const owner = (ownerSnapshot.data() || {}) as Owner;
    const token = randomUUID();
    const dogRef = adminDb.collection("dogs").doc();
    const contractRef = adminDb.collection("contracts").doc();
    const slug = `${nom.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${randomUUID().slice(0, 6)}`;
    const batch = adminDb.batch();
    batch.set(dogRef, { nom, ownerId, type: String(body.type || "chien"), race: String(body.race || "").slice(0, 150), dateNaissance: String(body.dateNaissance || ""), temperament: String(body.temperament || "").slice(0, 500), alertesSante: String(body.alertesSante || "").slice(0, 500), slug, motDePasse: randomUUID().slice(0, 10), createdAt: new Date() });
    batch.set(contractRef, { ownerId, dogId: dogRef.id, token, statut: "en_attente", createdAt: new Date() });
    await batch.commit();
    console.info("[admin/pets] pet and initial contract created", { dogId: dogRef.id, contractId: contractRef.id });
    const emailSent = await sendOnboardingEmail(request, owner, nom, token);
    return NextResponse.json({ ok: true, dogId: dogRef.id, contractId: contractRef.id, emailSent });
  } catch (error) { return errorResponse(error); }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin(request);
    const { dogId } = await request.json();
    if (!dogId || typeof dogId !== "string") return NextResponse.json({ error: "INVALID" }, { status: 400 });
    const dogSnapshot = await adminDb.collection("dogs").doc(dogId).get();
    if (!dogSnapshot.exists) return NextResponse.json({ error: "PET_NOT_FOUND" }, { status: 404 });
    const dog = dogSnapshot.data() || {};
    const existing = await adminDb.collection("contracts").where("dogId", "==", dogId).limit(1).get();
    if (!existing.empty) return NextResponse.json({ ok: true, existing: true, contractId: existing.docs[0].id, emailSent: false });
    const ownerSnapshot = await adminDb.collection("owners").doc(String(dog.ownerId || "")).get();
    if (!ownerSnapshot.exists) return NextResponse.json({ error: "OWNER_NOT_FOUND" }, { status: 404 });
    const token = randomUUID();
    const contractRef = await adminDb.collection("contracts").add({ ownerId: dog.ownerId, dogId, token, statut: "en_attente", createdAt: new Date() });
    console.info("[admin/pets] missing initial contract restored", { dogId, contractId: contractRef.id });
    const emailSent = await sendOnboardingEmail(request, (ownerSnapshot.data() || {}) as Owner, String(dog.nom || "Votre compagnon"), token);
    return NextResponse.json({ ok: true, contractId: contractRef.id, emailSent });
  } catch (error) { return errorResponse(error); }
}
