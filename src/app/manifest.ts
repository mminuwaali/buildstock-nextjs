import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BuildStock Supply Operations",
    short_name: "BuildStock",
    description:
      "Offline-first stock and sales management for construction supply stores.",
    start_url: "/overview",
    display: "standalone",
    background_color: "#F4F6F8",
    theme_color: "#14283F",
    orientation: "any",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
