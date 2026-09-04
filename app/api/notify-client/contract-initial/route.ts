import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { hasContractAccess } from "@/lib/contract-access";

export async function POST(req: Request) {
  try {
    const { dogName, ownerName, ownerEmail, token } = await req.json();
    if (!(await hasContractAccess(token, "contracts"))) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    if (!dogName || !ownerName || !ownerEmail) {
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

    const subject =
      "🐾 Votre contrat est validé – Bienvenue chez Comme à la maison";

    const htmlContent = `
<div style="background:#f8f5ff; padding:40px 20px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:620px; margin:auto; background:#ffffff; border-radius:24px; padding:40px; box-shadow:0 20px 60px rgba(91,33,182,0.15);">

    <!-- HEADER -->
    <div style="text-align:center; margin-bottom:30px;">
      <h1 style="margin:0; font-size:26px; color:#5b21b6; letter-spacing:1px;">
        Comme à la maison by Angèle
      </h1>
      <p style="margin:6px 0 0; color:#7c3aed; font-weight:500;">
        Validation du contrat initial
      </p>
    </div>

    <!-- BADGE -->
    <div style="text-align:center; margin-bottom:30px;">
      <span style="background:#ede9fe; color:#5b21b6; padding:10px 18px; border-radius:999px; font-size:14px; font-weight:600;">
        ✅ Contrat confirmé
      </span>
    </div>

    <!-- INFOS -->
    <div style="background:#faf5ff; padding:25px; border-radius:18px; margin-bottom:25px;">
      <p style="margin:8px 0;"><strong>🐾 Animal :</strong> ${dogName}</p>
      <p style="margin:8px 0;"><strong>👤 Propriétaire :</strong> ${ownerName}</p>
      <p style="margin:8px 0;"><strong>📅 Date de validation :</strong> ${new Date().toLocaleDateString()}</p>
    </div>

    <!-- CONTENU -->
    <div style="color:#4b5563; font-size:14px; line-height:1.7;">
      <p>Bonjour ${ownerName},</p>

      <p>
        Votre contrat général a bien été validé 🤍
      </p>

      <p>
        Toutes les informations concernant <strong>${dogName}</strong> sont désormais enregistrées.
        Ce document servira de base pour l’ensemble des futurs séjours.
      </p>

      <p>
        Vous pourrez confirmer vos prochaines dates de garde en toute simplicité.
      </p>
    </div>

    <!-- BLOC CONFIANCE -->
    <div style="background:#ede9fe; padding:18px; border-radius:14px; margin-top:25px;">
      <p style="margin:0; font-size:13px; color:#5b21b6; font-weight:600;">
        🤍 Engagement
      </p>
      <p style="margin:6px 0 0; font-size:13px; color:#5b21b6;">
        Votre animal sera accueilli dans un environnement calme, sécurisé et familial.
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
    console.error("Erreur email contrat initial client :", error);
    return NextResponse.json(
      { error: "Erreur envoi email" },
      { status: 500 }
    );
  }
}
