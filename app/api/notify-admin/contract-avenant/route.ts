import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { transporter } from "@/lib/mailer";

export async function POST(req: Request) {
  try {
    const {
      type,
      dogName,
      ownerName,
      dateDebut,
      dateFin,
      prix
    } = await req.json();
    const isInitial = type === "initial";


    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });



 const subject = isInitial
  ? "🐾 Contrat initial signé – Validation confirmée"
  : "🏡 Avenant de séjour signé – Confirmation reçue";

const htmlContent = `
<div style="background:#f8f5ff; padding:40px 20px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:620px; margin:auto; background:#ffffff; border-radius:24px; padding:40px; box-shadow:0 20px 60px rgba(91,33,182,0.15);">

    <!-- HEADER -->
    <div style="text-align:center; margin-bottom:30px;">
      <h1 style="margin:0; font-size:26px; color:#5b21b6; letter-spacing:1px;">
        Comme à la maison by Angèle
      </h1>
      <p style="margin:6px 0 0; color:#7c3aed; font-weight:500;">
        ${isInitial ? "Validation du contrat initial" : "Signature d’avenant de séjour"}
      </p>
    </div>

    <!-- BADGE -->
    <div style="text-align:center; margin-bottom:30px;">
      <span style="background:#ede9fe; color:#5b21b6; padding:10px 18px; border-radius:999px; font-size:14px; font-weight:600;">
        ✅ Signature confirmée
      </span>
    </div>

    <!-- BLOC INFOS -->
    <div style="background:#faf5ff; padding:25px; border-radius:18px; margin-bottom:25px;">
      <p style="margin:8px 0;"><strong>🐾 Animal :</strong> ${dogName}</p>
      <p style="margin:8px 0;"><strong>👤 Propriétaire :</strong> ${ownerName}</p>

      ${
        !isInitial
          ? `
        <p style="margin:8px 0;">
          <strong>📅 Séjour :</strong> du ${new Date(dateDebut).toLocaleDateString()} au ${new Date(dateFin).toLocaleDateString()}
        </p>
        <p style="margin:8px 0; font-weight:600; color:#4c1d95;">
          💰 Montant : ${prix} €
        </p>
      `
          : ""
      }
    </div>

    <!-- CONTENU DYNAMIQUE -->
    ${
      isInitial
        ? `
      <div style="color:#4b5563; font-size:14px; line-height:1.7;">
        <p>
          Le contrat initial a été validé avec succès.
          L’animal est désormais officiellement enregistré dans le système.
        </p>

        <p>
          Les informations administratives, médicales et comportementales
          transmises ont été confirmées.
        </p>

        <p>
          Ce document constitue la base contractuelle pour l’ensemble des futurs séjours.
        </p>
      </div>

      <div style="background:#ede9fe; padding:18px; border-radius:14px; margin-top:25px;">
        <p style="margin:0; font-size:13px; color:#5b21b6; font-weight:600;">
          📌 Prochaine étape :
        </p>
        <p style="margin:6px 0 0; font-size:13px; color:#5b21b6;">
          Vous pouvez désormais planifier des séjours et générer des avenants complémentaires.
        </p>
      </div>
    `
        : `
      <div style="color:#4b5563; font-size:14px; line-height:1.7;">
        <p>
          L’avenant de séjour a été signé par le propriétaire.
        </p>

        <p>
          Le séjour est désormais confirmé et archivé dans votre espace administrateur.
        </p>
      </div>
    `
    }

    <!-- BOUTON -->
    <div style="text-align:center; margin-top:35px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
         style="display:inline-block; background:linear-gradient(135deg,#7c3aed,#5b21b6); color:#ffffff; padding:14px 28px; border-radius:12px; text-decoration:none; font-weight:600; box-shadow:0 8px 20px rgba(124,58,237,0.3);">
         Accéder au dashboard
      </a>
    </div>

    <!-- FOOTER -->
    <div style="margin-top:40px; text-align:center; font-size:12px; color:#a1a1aa;">
      <p style="margin:0;">
        Notification automatique — Comme à la maison by Angèle
      </p>
      <p style="margin:6px 0 0;">
        Offrir un séjour comme à la maison 🐾
      </p>
    </div>

  </div>
</div>
`;

await transporter.sendMail({
  from: `"Comme à la maison by Angèle" <${process.env.GMAIL_USER}>`,
  to: process.env.GMAIL_USER,
  subject,
  html: htmlContent,
});

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur email" }, { status: 500 });
  }
}