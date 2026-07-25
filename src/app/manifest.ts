import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LIFE — AI OS for your life",
    short_name: "LIFE",
    description:
      "Dokumente, Verträge, Vermögen und KI an einem Ort — dein digitaler Begleiter.",
    start_url: "/home",
    display: "standalone",
    background_color: "#0b0b12",
    theme_color: "#0b0b12",
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
