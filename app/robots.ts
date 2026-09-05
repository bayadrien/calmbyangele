import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/", disallow: ["/dashboard/", "/d/", "/contrat/", "/contrat-sejour/"] }, sitemap: "https://calmbyangele.vercel.app/sitemap.xml" };
}
