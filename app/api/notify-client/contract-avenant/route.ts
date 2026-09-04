import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { hasContractAccess } from "@/lib/contract-access";

export async function POST(req: Request) {
  try {
    const {
      dogName,
      ownerName,
      ownerEmail,
      dateDebut,
      dateFin,
      prix,
      token,
    } = await req.json();
    if (!(await hasContractAccess(token, "stayContracts"))) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    if (
      !dogName ||
      !ownerName ||
      !ownerEmail ||
      !dateDebut ||
      !dateFin ||
      !prix
    ) {
      return NextResponse.json(
        { error: "Données manquantes" },
        { status: 400 }
      );
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const subject = `🏡 Séjour confirmé pour ${dogName} – Tout est prêt`;

    const htmlContent = `
<div style="background:#f8f5ff; padding:40px 20px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:620px; margin:auto; background:#ffffff; border-radius:24px; padding:40px; box-shadow:0 20px 60px rgba(91,33,182,0.15);">

    <!-- HEADER -->
    <div style="text-align:center; margin-bottom:30px;">
      <h1 style="margin:0; font-size:26px; color:#5b21b6; letter-spacing:1px;">
        Comme à la maison by Angèle
      </h1>
      <p style="margin:6px 0 0; color:#7c3aed; font-weight:500;">
        Confirmation de séjour
      </p>
    </div>

    <!-- BADGE -->
    <div style="text-align:center; margin-bottom:30px;">
      <span style="background:#ede9fe; color:#5b21b6; padding:10px 18px; border-radius:999px; font-size:14px; font-weight:600;">
        🏡 Séjour validé
      </span>
    </div>

    <!-- INFOS SEJOUR -->
    <div style="background:#faf5ff; padding:25px; border-radius:18px; margin-bottom:25px;">
      <p style="margin:8px 0;"><strong>🐾 Animal :</strong> ${dogName}</p>
      <p style="margin:8px 0;"><strong>👤 Propriétaire :</strong> ${ownerName}</p>
      <p style="margin:8px 0;">
        <strong>📅 Séjour :</strong> du ${new Date(
          dateDebut
        ).toLocaleDateString()} au ${new Date(dateFin).toLocaleDateString()}
      </p>
      <p style="margin:8px 0; font-weight:600; color:#4c1d95;">
        💰 Montant total : ${prix} €
      </p>
    </div>

    <!-- MESSAGE -->
    <div style="color:#4b5563; font-size:14px; line-height:1.7;">
      <p>Bonjour ${ownerName},</p>

      <p>
        Le séjour de <strong>${dogName}</strong> est désormais officiellement confirmé 🐾
      </p>

      <p>
        Tout est prêt pour l’accueillir dans un environnement calme,
        sécurisé et familial.
      </p>

      <p>
        Pendant la garde, vous recevrez des nouvelles ainsi que des photos
        afin de suivre son séjour en toute sérénité.
      </p>
    </div>

    <!-- BLOC SERENITE -->
    <div style="background:#ede9fe; padding:18px; border-radius:14px; margin-top:25px;">
      <p style="margin:0; font-size:13px; color:#5b21b6; font-weight:600;">
        🤍 En toute confiance
      </p>
      <p style="margin:6px 0 0; font-size:13px; color:#5b21b6;">
        Je reste disponible à tout moment si vous avez la moindre question
        avant ou pendant le séjour.
      </p>
    </div>

    <!-- FOOTER -->
    <div style="margin-top:40px; text-align:center; font-size:12px; color:#a1a1aa;">
      <p style="margin:0;">
        Merci pour votre confiance
      </p>
      <p style="margin:6px 0 0;">
        Comme à la maison by Angèle – Bourbourg
      </p>
    </div>

  </div>
</div>
`;

    await transporter.sendMail({
      from: `"Comme à la maison by Angèle" <${process.env.GMAIL_USER}>`,
      to: ownerEmail,
      cc: process.env.GMAIL_USER,
      replyTo: process.env.GMAIL_USER,
      subject,
      html: htmlContent,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur email avenant client :", error);
    return NextResponse.json(
      { error: "Erreur envoi email" },
      { status: 500 }
    );
  }
}
