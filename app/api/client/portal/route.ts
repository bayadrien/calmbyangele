import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function GET(request: Request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    const user = await adminAuth.verifyIdToken(token);
    const email = user.email?.toLowerCase();
    if (!email) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    const owners = await adminDb.collection("owners").get();
    const ownerDoc = owners.docs.find((item) => String(item.data().email || "").toLowerCase() === email);
    if (!ownerDoc) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    const owner = { id: ownerDoc.id, ...ownerDoc.data() } as any;
    const dogs = (await adminDb.collection("dogs").where("ownerId", "==", owner.id).get()).docs.map((item) => ({ id: item.id, ...item.data() }));
    const dogIds = new Set(dogs.map((dog: any) => dog.id));
    const bookings = (await adminDb.collection("bookings").get()).docs.map((item) => ({ id: item.id, ...item.data() } as any)).filter((item) => dogIds.has(item.dogId));
    const contracts = (await adminDb.collection("contracts").where("ownerId", "==", owner.id).get()).docs.map((item) => ({ id: item.id, ...item.data() }));
    const stayContracts = (await adminDb.collection("stayContracts").where("ownerId", "==", owner.id).get()).docs.map((item) => ({ id: item.id, ...item.data() }));
    const bookingIds = new Set(bookings.map((booking: any) => booking.id));
    const photos = (await adminDb.collection("photos").get()).docs.map((item) => ({ id: item.id, ...item.data() } as any)).filter((item) => bookingIds.has(item.bookingId));
    return NextResponse.json({ owner, dogs, bookings, contracts, stayContracts, photos });
  } catch { return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 }); }
}
