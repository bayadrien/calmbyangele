import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { createGallerySession, galleryCookie, hashGalleryCode, matchesGalleryCode } from "@/lib/gallery-access";

export async function POST(request: Request) {
  try {
    const { slug, code } = await request.json();
    if (typeof slug !== "string" || typeof code !== "string" || code.length < 4) {
      return NextResponse.json({ error: "Accès invalide" }, { status: 400 });
    }

    const snapshot = await adminDb.collection("dogs").where("slug", "==", slug).limit(1).get();
    if (snapshot.empty) return NextResponse.json({ error: "Galerie introuvable" }, { status: 404 });

    const dog = snapshot.docs[0];
    const data = dog.data();
    if (data.galleryEnabled !== true || !(await matchesGalleryCode(code, data.galleryCodeHash, data.motDePasse))) {
      return NextResponse.json({ error: "Code incorrect" }, { status: 401 });
    }

    // Existing plaintext codes are migrated after a successful verification.
    if (!data.galleryCodeHash) {
      await dog.ref.update({ galleryCodeHash: await hashGalleryCode(code), motDePasse: FieldValue.delete() });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set(galleryCookie.name, createGallerySession(slug), galleryCookie);
    return response;
  } catch (error) {
    console.error("GALLERY ACCESS ERROR", error);
    return NextResponse.json({ error: "Impossible de vérifier l’accès" }, { status: 500 });
  }
}
