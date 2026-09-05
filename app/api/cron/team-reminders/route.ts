import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { transporter } from "@/lib/mailer";

const dateKey = (date: Date) => date.toISOString().slice(0, 10);

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const target = dateKey(tomorrow);
  const bookings = await adminDb.collection("bookings").where("dateDebut", "==", target).get();
  let sent = 0;
  for (const booking of bookings.docs) {
    const reminder = adminDb.collection("teamReminders").doc(`arrival-${booking.id}-${target}`);
    try { await reminder.create({ bookingId: booking.id, target, createdAt: new Date() }); } catch { continue; }
    const data = booking.data(); const dog = data.dogId ? await adminDb.collection("dogs").doc(data.dogId).get() : null;
    await transporter.sendMail({ from: `"CALM by Angèle" <${process.env.GMAIL_USER}>`, to: process.env.GMAIL_USER, subject: `Demain · arrivée de ${dog?.data()?.nom || "votre compagnon"}`, html: `<p>Rappel CALM : <strong>${dog?.data()?.nom || "un compagnon"}</strong> arrive demain.</p><p>Préparez l’accueil, les informations santé et les affaires nécessaires.</p>` });
    sent++;
  }
  return NextResponse.json({ ok: true, sent });
}
