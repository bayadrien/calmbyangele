import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { transporter } from "@/lib/mailer";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.image) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      );
    }

    const uploadResponse = await cloudinary.uploader.upload(body.image, {
      folder: "signatures",
    });

    return NextResponse.json({
      url: uploadResponse.secure_url,
    });
  } catch (error: any) {
    console.error("Cloudinary error:", error);

    return NextResponse.json(
      { error: error.message || "Upload failed" },
      { status: 500 }
    );
  }
}