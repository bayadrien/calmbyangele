import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    const user = await adminAuth.verifyIdToken(token); const email = user.email?.toLowerCase();
    const owners = await adminDb.collection("owners").get(); const owner = owners.docs.find((item) => String(item.data().email || "").toLowerCase() === email);
    if (!owner) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    const { photoId, message } = await request.json(); const text = String(message || "").trim().slice(0, 500);
    if (!photoId || !text) return NextResponse.json({ error: "INVALID" }, { status: 400 });
    const photo = await adminDb.collection("photos").doc(String(photoId)).get();
    const booking = photo.exists ? await adminDb.collection("bookings").doc(String(photo.data()?.bookingId || "")).get() : null;
    const dog = booking?.exists ? await adminDb.collection("dogs").doc(String(booking.data()?.dogId || "")).get() : null;
    if (!dog?.exists || dog.data()?.ownerId !== owner.id) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    await adminDb.collection("photoComments").add({ photoId, ownerId: owner.id, message: text, createdAt: new Date() });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "SERVER" }, { status: 500 }); }
}
