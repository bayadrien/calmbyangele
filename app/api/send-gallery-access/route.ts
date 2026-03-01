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
    } = await req.json();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

// 📬 MAIL CLIENT
await transporter.sendMail({
  from: `"Comme à la maison by Angèle" <${process.env.GMAIL_USER}>`,
  to: ownerEmail,
subject: `📸 Galerie disponible – ${dogName}`,

html: `
<div style="background:#f3f0fa; padding:40px 20px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:620px; margin:auto; background:#ffffff; border-radius:24px; padding:40px; box-shadow:0 15px 40px rgba(91,33,182,0.15);">

    <!-- HEADER -->
    <div style="text-align:center; margin-bottom:30px;">
      <h1 style="margin:0; font-size:26px; color:#5b21b6;">
        Comme à la maison by Angèle
      </h1>
      <p style="margin:6px 0 0; color:#7c3aed; font-weight:500;">
        Galerie photo privée
      </p>
    </div>

    <!-- BADGE -->
    <div style="text-align:center; margin-bottom:30px;">
      <span style="background:#ede9fe; color:#5b21b6; padding:10px 18px; border-radius:999px; font-size:14px; font-weight:600;">
        📸 Galerie maintenant accessible
      </span>
    </div>

    <!-- MESSAGE -->
    <div style="background:#f5f3ff; padding:25px; border-radius:18px; margin-bottom:25px; color:#333;">
      <p style="margin:8px 0;">
        Bonjour <strong>${ownerName}</strong>,
      </p>

      <p style="margin:8px 0;">
        La galerie privée de <strong>${dogName}</strong> est désormais disponible.
      </p>

      <p style="margin:8px 0;">
        Cliquez sur le bouton ci-dessous pour découvrir les photos du séjour.
      </p>
    </div>

    <!-- CODE -->
    <div style="background:#ede9fe; padding:20px; border-radius:14px; margin-bottom:30px;">
      <p style="margin:0; font-size:13px; color:#5b21b6; font-weight:600;">
        🔐 Code d’accès :
      </p>
      <p style="margin:6px 0 0; font-size:20px; font-weight:700; color:#4c1d95;">
        ${accessCode}
      </p>
    </div>

    <!-- BOUTON FIX -->
    <div style="text-align:center; margin:30px 0;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin:auto;">
            <tr>
            <td align="center" bgcolor="#7c3aed" style="border-radius:12px;">
                <a href="${galleryUrl}"
                style="display:inline-block;
                        padding:14px 28px;
                        font-size:16px;
                        font-weight:600;
                        color:#ffffff;
                        text-decoration:none;
                        border-radius:12px;
                        background-color:#6d28d9;">
                Accéder à la galerie
                </a>
            </td>
            </tr>
        </table>
        </div>

    <!-- FOOTER -->
    <div style="margin-top:40px; text-align:center; font-size:12px; color:#888;">
      <p style="margin:0;">
        Merci pour votre confiance 🐾
      </p>
      <p style="margin:6px 0 0;">
        Comme à la maison by Angèle
      </p>
    </div>

  </div>
</div>
`,
});

// 📩 MAIL ADMIN CONFIRMATION
await transporter.sendMail({
  from: `"Comme à la maison by Angèle" <${process.env.GMAIL_USER}>`,
  to: process.env.GMAIL_USER,
  subject: `✅ Galerie envoyée – ${dogName}`,
  html: `
  <div style="background:#f8f5ff; padding:30px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <div style="background:white; max-width:500px; margin:auto; padding:30px; border-radius:20px; box-shadow:0 15px 40px rgba(91,33,182,0.15);">

      <h2 style="color:#5b21b6; margin-top:0;">
        📸 Galerie envoyée
      </h2>

      <p>
        La galerie de <strong>${dogName}</strong> a été envoyée avec succès.
      </p>

      <p>
        👤 Client : ${ownerName}<br/>
        📧 Email : ${ownerEmail}
      </p>

      <p style="margin-top:20px; font-size:13px; color:#777;">
        Notification automatique – Dashboard
      </p>

    </div>
  </div>
  `,
});

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("GALLERY MAIL ERROR:", error);
    return NextResponse.json({ error: "Erreur envoi" }, { status: 500 });
  }
}