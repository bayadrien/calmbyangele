import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/server-auth";
import { transporter } from "@/lib/mailer";

export async function POST(request: Request) {
  try {
    await requireAdmin(request); const { dogId, humeur, note } = await request.json(); const dog = await adminDb.collection("dogs").doc(String(dogId || "")).get();
    const owner = dog.exists ? await adminDb.collection("owners").doc(dog.data()?.ownerId).get() : null;
    if (!owner?.data()?.email) return NextResponse.json({ ok: true, sent: false });
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
    await transporter.sendMail({ from: `"CALM by Angèle" <${process.env.GMAIL_USER}>`, to: owner.data()?.email, subject: `Une nouvelle de ${dog.data()?.nom || "votre compagnon"} vous attend`, html: `<div style="font-family:Arial,sans-serif;color:#274c3e"><h1>Un petit mot de CALM</h1><p>Bonjour ${owner.data()?.prenom || ""},</p><p>${dog.data()?.nom || "Votre compagnon"} est <strong>${humeur || "bien"}</strong> aujourd’hui.</p>${note ? `<p>« ${String(note).slice(0, 500)} »</p>` : ""}<p><a href="${appUrl}/client/journal">Lire le journal de séjour →</a></p></div>` });
    return NextResponse.json({ ok: true, sent: true });
  } catch { return NextResponse.json({ error: "SERVER" }, { status: 500 }); }
}
