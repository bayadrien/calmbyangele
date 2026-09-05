import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminDb } from "@/lib/firebase-admin";
import { galleryCookie, readGallerySession } from "@/lib/gallery-access";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = readGallerySession((await cookies()).get(galleryCookie.name)?.value);
  if (!session || session.slug !== slug) return NextResponse.json({ error: "Accès non autorisé" }, { status: 401 });

  try {
    const dogSnapshot = await adminDb.collection("dogs").where("slug", "==", slug).limit(1).get();
    if (dogSnapshot.empty) return NextResponse.json({ error: "Galerie introuvable" }, { status: 404 });
    const dogDoc = dogSnapshot.docs[0];
    const dog = dogDoc.data();
    if (dog.galleryEnabled !== true) return NextResponse.json({ error: "Galerie désactivée" }, { status: 403 });

    const bookingsSnapshot = await adminDb.collection("bookings").where("dogId", "==", dogDoc.id).get();
    const bookings = bookingsSnapshot.docs.map((booking) => {
      const data = booking.data();
      return { id: booking.id, dateDebut: data.dateDebut, dateFin: data.dateFin, nombreNuits: data.nombreNuits };
    });
    const bookingIds = bookings.map((booking) => booking.id);
    const photoSnapshots = await Promise.all(
      Array.from({ length: Math.ceil(bookingIds.length / 10) }, (_, index) =>
        adminDb.collection("photos").where("bookingId", "in", bookingIds.slice(index * 10, index * 10 + 10)).get(),
      ),
    );
    const photos = photoSnapshots.flatMap((snapshot) => snapshot.docs).map((photo) => {
      const data = photo.data();
      return { id: photo.id, bookingId: data.bookingId, imageUrl: data.imageUrl, caption: data.caption ?? "", category: data.category ?? "moment", createdAt: data.createdAt?.toDate?.().toISOString() ?? null };
    });

    return NextResponse.json({
      dog: { nom: dog.nom, race: dog.race ?? "", dateNaissance: dog.dateNaissance ?? "", photoProfil: dog.photoProfil ?? null },
      bookings,
      photos,
    });
  } catch (error) {
    console.error("GALLERY DATA ERROR", error);
    return NextResponse.json({ error: "Impossible de charger la galerie" }, { status: 500 });
  }
}
