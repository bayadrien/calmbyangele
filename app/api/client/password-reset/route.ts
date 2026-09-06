import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { transporter } from "@/lib/mailer";

const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", "\"": "&quot;" })[character] || character);

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: "INVALID" }, { status: 400 });
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) return NextResponse.json({ fallback: true });
  try {
    const resetLink = await adminAuth.generatePasswordResetLink(email);
    const safeEmail = escapeHtml(email);
    await transporter.sendMail({ from: `"CALM by Angèle" <${process.env.GMAIL_USER}>`, to: email, subject: "Choisissez votre nouveau mot de passe · CALM by Angèle", text: `Bonjour,\n\nVous avez demandé à choisir un nouveau mot de passe pour votre espace famille CALM.\n\nUtilisez ce lien : ${resetLink}\n\nSi vous n’êtes pas à l’origine de cette demande, vous pouvez ignorer cet e-mail.\n\nÀ bientôt,\nCALM by Angèle`, html: `<!doctype html><html lang="fr"><body style="margin:0;background:#f4f5ef;font-family:Arial,sans-serif;color:#274c3e"><div style="max-width:560px;margin:0 auto;padding:36px 18px"><div style="text-align:center;margin-bottom:20px"><div style="display:inline-block;width:54px;height:54px;border-radius:18px;background:#315e4e;color:#fff;font-size:26px;line-height:54px">♧</div><h1 style="margin:12px 0 0;font-family:Georgia,serif;font-size:28px">CALM <em style="font-weight:400">by Angèle</em></h1></div><main style="background:#fffefa;border-radius:24px;padding:34px 30px;box-shadow:0 14px 36px rgba(31,58,47,.1)"><p style="margin:0;color:#6a7a70;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase">Espace famille</p><h2 style="margin:12px 0 14px;font-size:26px;line-height:1.15">Choisissez votre nouveau mot de passe.</h2><p style="color:#5f7067;line-height:1.65">Bonjour,</p><p style="color:#5f7067;line-height:1.65">Une demande de réinitialisation a été faite pour l’adresse <strong>${safeEmail}</strong>. Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe.</p><p style="margin:28px 0"><a href="${resetLink}" style="display:inline-block;border-radius:12px;background:#315e4e;padding:14px 20px;color:#fff;text-decoration:none;font-weight:700">Choisir mon mot de passe&nbsp; →</a></p><p style="color:#7a8880;font-size:13px;line-height:1.6">Si vous n’êtes pas à l’origine de cette demande, vous pouvez simplement ignorer cet e-mail.</p></main><p style="margin:20px 0;text-align:center;color:#7a8880;font-size:12px">CALM by Angèle · Conciergerie canine</p></div></body></html>` });
  } catch (error) { console.error("Password reset email failed", error); return NextResponse.json({ fallback: true }); }
  return NextResponse.json({ ok: true });
}
