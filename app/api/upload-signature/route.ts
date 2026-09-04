import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { adminDb } from "@/lib/firebase-admin";

cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET });

export async function POST(request: Request) {
  try {
    const { image, token } = await request.json();
    if (typeof image !== "string" || typeof token !== "string" || image.length > 2_000_000) {
      return NextResponse.json({ error: "Données de signature invalides" }, { status: 400 });
    }
    const contract = await adminDb.collection("contracts").where("token", "==", token).limit(1).get();
    if (contract.empty || contract.docs[0].data().statut === "signé") {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }
    const result = await cloudinary.uploader.upload(image, { folder: "calm/signatures", resource_type: "image" });
    return NextResponse.json({ url: result.secure_url });
  } catch (error) {
    console.error("UPLOAD SIGNATURE ERROR", error);
    return NextResponse.json({ error: "Impossible d’enregistrer la signature" }, { status: 500 });
  }
}
