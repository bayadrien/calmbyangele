import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET() {
  try {
    const [bookings, unavailabilities] = await Promise.all([adminDb.collection("bookings").get(), adminDb.collection("unavailabilities").get()]);
    const blocked = [
      ...bookings.docs.map((item) => ({ start: item.data().dateDebut, end: item.data().dateFin, kind: "garde" })),
      ...unavailabilities.docs.map((item) => ({ start: item.data().startDate, end: item.data().endDate, kind: "indisponible" })),
    ].filter((item) => item.start && item.end);
    return NextResponse.json({ blocked });
  } catch { return NextResponse.json({ blocked: [] }); }
}
