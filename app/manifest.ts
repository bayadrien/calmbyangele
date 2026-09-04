import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CALM by Angèle",
    short_name: "CALM",
    description: "La conciergerie canine d’Angèle, toujours à portée de main.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f7f5ef",
    theme_color: "#315e4e",
    orientation: "portrait-primary",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
