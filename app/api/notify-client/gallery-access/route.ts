import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const {
      dogName,
      ownerName,
      ownerEmail,
      galleryUrl,
      accessCode,
      dateDebut,
      dateFin,
    } = await req.json();

    if (
      !dogName ||
      !ownerName ||
      !ownerEmail ||
      !galleryUrl ||
      !accessCode
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

    const subject = `📸 Accès à la galerie de ${dogName}`;

    const htmlContent = `
<div style="background:#f8f5ff; padding:40px 20px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:620px; margin:auto; background:#ffffff; border-radius:24px; padding:40px; box-shadow:0 20px 60px rgba(91,33,182,0.15);">

    <!-- HEADER -->
    <div style="text-align:center; margin-bottom:30px;">
      <h1 style="margin:0; font-size:26px; color:#5b21b6; letter-spacing:1px;">
        Comme à la maison by Angèle
      </h1>
      <p style="margin:6px 0 0; color:#7c3aed; font-weight:500;">
        Galerie photo privée
      </p>
    </div>

    <!-- BADGE -->
    <div style="text-align:center; margin-bottom:30px;">
      <span style="background:#ede9fe; color:#5b21b6; padding:10px 18px; border-radius:999px; font-size:14px; font-weight:600;">
        📸 Accès activé
      </span>
    </div>

    <!-- INFOS -->
    <div style="background:#faf5ff; padding:25px; border-radius:18px; margin-bottom:25px;">
      <p style="margin:8px 0;"><strong>🐾 Animal :</strong> ${dogName}</p>
      ${
        dateDebut && dateFin
          ? `<p style="margin:8px 0;">
              <strong>📅 Séjour :</strong> du ${new Date(
                dateDebut
              ).toLocaleDateString()} au ${new Date(
              dateFin
            ).toLocaleDateString()}
            </p>`
          : ""
      }
      <p style="margin:8px 0;"><strong>🔐 Code d’accès :</strong> ${accessCode}</p>
    </div>

    <!-- MESSAGE -->
    <div style="color:#4b5563; font-size:14px; line-height:1.7;">
      <p>Bonjour ${ownerName},</p>

      <p>
        Vous pouvez désormais suivre le séjour de <strong>${dogName}</strong> 🤍
      </p>

      <p>
        Les photos et nouvelles seront ajoutées régulièrement pendant la garde.
      </p>
    </div>

    <!-- BOUTON -->
    <div style="text-align:center; margin-top:30px;">
      <a href="${galleryUrl}"
         style="display:inline-block; background:linear-gradient(135deg,#7c3aed,#5b21b6); color:#ffffff; padding:14px 28px; border-radius:12px; text-decoration:none; font-weight:600; box-shadow:0 8px 20px rgba(124,58,237,0.3);">
         Accéder à la galerie
      </a>
    </div>

    <!-- BLOC SECURITE -->
    <div style="background:#ede9fe; padding:18px; border-radius:14px; margin-top:30px;">
      <p style="margin:0; font-size:13px; color:#5b21b6; font-weight:600;">
        🔒 Accès privé
      </p>
      <p style="margin:6px 0 0; font-size:13px; color:#5b21b6;">
        Ce lien est strictement personnel et réservé au propriétaire.
      </p>
    </div>

    <!-- FOOTER -->
    <div style="margin-top:40px; text-align:center; font-size:12px; color:#a1a1aa;">
      <p style="margin:0;">
        Je vous souhaite un séjour en toute sérénité
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
    console.error("Erreur email galerie :", error);
    return NextResponse.json(
      { error: "Erreur envoi email" },
      { status: 500 }
    );
  }
}