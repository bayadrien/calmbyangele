import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/server-auth";

const statuses = new Set(["nouvelle", "contactée", "archivée"]);

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const snapshot = await adminDb.collection("inquiries").orderBy("createdAt", "desc").limit(100).get();
    const items = snapshot.docs.map((item) => {
      const data = item.data();
      return {
        id: item.id,
        name: data.name ?? "",
        email: data.email ?? "",
        phone: data.phone ?? "",
        pet: data.pet ?? "",
        dates: data.dates ?? "",
        message: data.message ?? "",
        status: data.status ?? "nouvelle",
      };
    });
    return NextResponse.json({ items });
  } catch (error) {
    const status = error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 403;
    return NextResponse.json({ error: "FORBIDDEN" }, { status });
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin(request);
    const body = await request.json();
    const id = typeof body.id === "string" ? body.id : "";
    const status = typeof body.status === "string" ? body.status : "";
    if (!id || !statuses.has(status)) return NextResponse.json({ error: "INVALID" }, { status: 400 });
    await adminDb.collection("inquiries").doc(id).update({ status });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const status = error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 403;
    return NextResponse.json({ error: "FORBIDDEN" }, { status });
  }
}
