import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const {
      dogId,
      dogName,
      ownerName,
      ownerEmail,
      galleryUrl,
      photoCount,
      imageUrl,
    } = await req.json();

console.log("BODY RECEIVED:", {
  dogId,
  dogName,
  ownerEmail,
});

    if (!dogName || !ownerName || !ownerEmail || !galleryUrl) {
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

    const subject = `📷 Nouvelle photo de ${dogName} disponible`;

    const htmlContent = `
<div style="background:#f8f5ff; padding:40px 20px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:620px; margin:auto; background:#ffffff; border-radius:24px; padding:40px; box-shadow:0 20px 60px rgba(91,33,182,0.15);">

    <!-- HEADER -->
    <div style="text-align:center; margin-bottom:30px;">
      <h1 style="margin:0; font-size:26px; color:#5b21b6; letter-spacing:1px;">
        Comme à la maison by Angèle
      </h1>
      <p style="margin:6px 0 0; color:#7c3aed; font-weight:500;">
        Nouvelle photo ajoutée
      </p>
    </div>

    <!-- BADGE -->
    <div style="text-align:center; margin-bottom:30px;">
      <span style="background:#ede9fe; color:#5b21b6; padding:10px 18px; border-radius:999px; font-size:14px; font-weight:600;">
        📸 Mise à jour disponible
      </span>
    </div>

    <!-- MESSAGE -->
    <div style="color:#4b5563; font-size:14px; line-height:1.7;">
      <p>Bonjour ${ownerName},</p>

      <p>
        Une nouvelle photo de <strong>${dogName}</strong> vient d’être ajoutée 🤍
      </p>

      ${
        photoCount
          ? `<p>
               Il y a maintenant <strong>${photoCount}</strong> photo${
              photoCount > 1 ? "s" : ""
            } disponible${photoCount > 1 ? "s" : ""} dans la galerie.
             </p>`
          : ""
      }

      <p>
        Cliquez ci-dessous pour découvrir ce moment du séjour.
      </p>
    </div>

    ${
    imageUrl
        ? `
        <div style="margin:30px 0; text-align:center;">
        
        <div style="
            background:#faf5ff;
            padding:20px;
            border-radius:20px;
            border:2px solid #ede9fe;
            box-shadow:0 12px 30px rgba(91,33,182,0.12);
        ">

            <p style="
            margin:0 0 15px 0;
            font-size:13px;
            color:#5b21b6;
            font-weight:600;
            ">
            📸 Nouveau moment capturé
            </p>

            <img 
            src="${imageUrl}" 
            alt="Nouvelle photo"
            style="
                max-width:100%;
                border-radius:16px;
                display:block;
                margin:auto;
            "
            />

        </div>
        </div>
        `
        : ""
    }

    <!-- BOUTON -->
    <div style="text-align:center; margin-top:30px;">
      <a href="${galleryUrl}"
         style="display:inline-block; background:linear-gradient(135deg,#7c3aed,#5b21b6); color:#ffffff; padding:14px 28px; border-radius:12px; text-decoration:none; font-weight:600; box-shadow:0 8px 20px rgba(124,58,237,0.3);">
         Accéder à la galerie
      </a>
    </div>

    <!-- BLOC EMOTION -->
    <div style="background:#ede9fe; padding:18px; border-radius:14px; margin-top:30px;">
      <p style="margin:0; font-size:13px; color:#5b21b6; font-weight:600;">
        🐾 Petit instant du jour
      </p>
      <p style="margin:6px 0 0; font-size:13px; color:#5b21b6;">
        Chaque photo est partagée pour vous permettre de suivre le séjour en toute sérénité.
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

console.log("Updating Firestore for dog:", dogId);

    // ✅ Met à jour le timestamp côté serveur
    if (dogId) {
      await adminDb.collection("dogs").doc(dogId).update({
        lastGalleryNotification: new Date(),
      });
}

console.log("Firestore updated successfully");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur email nouvelle photo :", error);
    return NextResponse.json(
      { error: "Erreur envoi email" },
      { status: 500 }
    );
  }
}