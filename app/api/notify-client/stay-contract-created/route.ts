import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/server-auth";
import { transporter } from "@/lib/mailer";

export async function POST(request: Request) {
  try {
    await requireAdmin(request); const { stayContractId } = await request.json();
    const contract = await adminDb.collection("stayContracts").doc(String(stayContractId || "")).get();
    if (!contract.exists) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    const data = contract.data()!; const [owner, dog] = await Promise.all([adminDb.collection("owners").doc(data.ownerId).get(), adminDb.collection("dogs").doc(data.dogId).get()]);
    if (!owner.data()?.email) return NextResponse.json({ ok: true, sent: false });
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
    await transporter.sendMail({ from: `"CALM by Angèle" <${process.env.GMAIL_USER}>`, to: owner.data()?.email, subject: `Le contrat de séjour de ${dog.data()?.nom || "votre compagnon"} est prêt`, html: `<div style="font-family:Arial,sans-serif;color:#274c3e"><h1>Votre séjour se prépare.</h1><p>Bonjour ${owner.data()?.prenom || ""},</p><p>Le contrat du séjour de <strong>${dog.data()?.nom || "votre compagnon"}</strong>, du ${data.dateDebut} au ${data.dateFin}, est prêt à être lu et signé.</p><p><a href="${appUrl}/contrat-sejour/${data.token}" style="display:inline-block;background:#315e4e;color:white;padding:12px 16px;border-radius:10px;text-decoration:none;font-weight:bold">Lire et signer le contrat →</a></p><p>À très vite,<br/>CALM by Angèle</p></div>` });
    return NextResponse.json({ ok: true, sent: true });
  } catch { return NextResponse.json({ error: "SERVER" }, { status: 500 }); }
}
