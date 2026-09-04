import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { hasContractAccess } from "@/lib/contract-access";

export async function POST(request: Request) {
  try {
    const { dogName, ownerName, token } = await request.json();
    if (!dogName || !ownerName || !(await hasContractAccess(token, "contracts"))) {
      return NextResponse.json({ error: "Accès non autorisé ou données manquantes" }, { status: 403 });
    }
    const transporter = nodemailer.createTransport({ service: "gmail", auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD } });
    await transporter.sendMail({
      from: `"CALM by Angèle" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER,
      subject: `Contrat signé — ${dogName}`,
      html: `<p>Le contrat initial de <strong>${dogName}</strong>, appartenant à ${ownerName}, vient d’être signé.</p>`,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("CONTRACT INITIAL ADMIN NOTIFICATION ERROR", error);
    return NextResponse.json({ error: "Impossible d’envoyer la notification" }, { status: 500 });
  }
}
