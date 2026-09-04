import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { transporter } from "@/lib/mailer";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim().slice(0, 100) : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase().slice(0, 200) : "";
    const message = typeof body.message === "string" ? body.message.trim().slice(0, 2000) : "";
    if (body.website || !name || !email || !message || !/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: "INVALID" }, { status: 400 });
    const inquiry = { name, email, phone: String(body.phone || "").trim().slice(0, 50), pet: String(body.pet || "").trim().slice(0, 200), dates: String(body.dates || "").trim().slice(0, 150), message, status: "nouvelle", createdAt: new Date() };
    await adminDb.collection("inquiries").add(inquiry);
    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) await transporter.sendMail({ from: `"CALM by Angèle" <${process.env.GMAIL_USER}>`, to: process.env.GMAIL_USER, replyTo: email, subject: `Nouvelle demande · ${name}`, text: `${name}\n${email}\n${inquiry.phone}\n\nAnimal : ${inquiry.pet}\nDates : ${inquiry.dates}\n\n${message}` });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "SERVER" }, { status: 500 }); }
}
