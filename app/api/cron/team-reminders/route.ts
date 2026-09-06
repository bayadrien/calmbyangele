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
    const owner = dog?.data()?.ownerId ? await adminDb.collection("owners").doc(dog.data()?.ownerId).get() : null;
    if (owner?.data()?.email) await transporter.sendMail({ from: `"CALM by Angèle" <${process.env.GMAIL_USER}>`, to: owner.data()?.email, subject: `Demain, c’est le séjour de ${dog?.data()?.nom || "votre compagnon"}`, html: `<div style="font-family:Arial,sans-serif;color:#274c3e"><h1>À demain chez CALM.</h1><p>Petit rappel : <strong>${dog?.data()?.nom || "votre compagnon"}</strong> est attendu(e) demain.</p><p><strong>La checklist d’arrivée :</strong></p><ul><li>Son alimentation pour toute la durée du séjour.</li><li>Ses traitements et les consignes associées, si besoin.</li><li>Son carnet de santé ou toute information importante.</li><li>Un objet rassurant : doudou, panier ou jouet préféré.</li><li>Confirmer l’horaire d’arrivée convenu.</li></ul><p>À demain !<br/>CALM by Angèle</p></div>` });
    sent++;
  }
  const departures = await adminDb.collection("bookings").where("dateFin", "==", target).get();
  for (const booking of departures.docs) {
    const reminder = adminDb.collection("clientReminders").doc(`departure-${booking.id}-${target}`);
    try { await reminder.create({ bookingId: booking.id, target, createdAt: new Date() }); } catch { continue; }
    const data = booking.data(); const dog = await adminDb.collection("dogs").doc(data.dogId).get(); const owner = dog.exists ? await adminDb.collection("owners").doc(dog.data()?.ownerId).get() : null;
    if (owner?.data()?.email) { await transporter.sendMail({ from: `"CALM by Angèle" <${process.env.GMAIL_USER}>`, to: owner.data()?.email, subject: `Demain, c’est le retour de ${dog.data()?.nom || "votre compagnon"}`, html: `<div style="font-family:Arial,sans-serif;color:#274c3e"><h1>À demain pour les retrouvailles.</h1><p>${dog.data()?.nom || "Votre compagnon"} rentre demain.</p><p><strong>Petite checklist de départ :</strong></p><ul><li>Prévoir l’horaire de récupération convenu.</li><li>Nous signaler tout changement de dernière minute.</li><li>Penser au règlement du séjour s’il reste à effectuer.</li></ul><p>À très vite,<br/>CALM by Angèle</p></div>` }); sent++; }
  }
  const contracts = await adminDb.collection("contracts").where("statut", "==", "en_attente").get();
  for (const contract of contracts.docs) {
    const key = `contract-${contract.id}-${target}`; const reminder = adminDb.collection("clientReminders").doc(key);
    try { await reminder.create({ contractId: contract.id, target, createdAt: new Date() }); } catch { continue; }
    const data = contract.data(); const owner = await adminDb.collection("owners").doc(data.ownerId).get(); const dog = await adminDb.collection("dogs").doc(data.dogId).get();
    if (owner.data()?.email) { await transporter.sendMail({ from: `"CALM by Angèle" <${process.env.GMAIL_USER}>`, to: owner.data()?.email, subject: `Un contrat CALM attend votre signature`, html: `<p>Bonjour,</p><p>Le contrat initial de <strong>${dog.data()?.nom || "votre compagnon"}</strong> est prêt dans votre espace CALM.</p><p>Vous pouvez le lire et le signer en quelques minutes depuis <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://calmbyangele.vercel.app"}/client/contracts">vos contrats</a>.</p>` }); sent++; }
  }
  return NextResponse.json({ ok: true, sent });
}
