import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { image } = await req.json()

    if (!image) {
      return NextResponse.json({ error: "Image manquante" }, { status: 400 })
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const uploadPreset = "calm_unsigned"

    const formData = new FormData()
    formData.append("file", image)
    formData.append("upload_preset", uploadPreset)

    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    )

    const upload = await uploadRes.json()
    console.log("CLOUDINARY RESPONSE:", upload)

    if (!upload.secure_url) {
      return NextResponse.json({ error: upload }, { status: 500 })
    }

    return NextResponse.json({ url: upload.secure_url })

  } catch (error) {
    console.error("UPLOAD SIGNATURE ERROR:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}