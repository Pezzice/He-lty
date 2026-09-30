import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "HE@LTY",
    short_name: "HE@LTY",
    description: "Indicazioni giornaliere per il benessere",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f8f7",
    theme_color: "#0f766e",
    lang: "it",
    icons: [{ src: "/favicon.ico", sizes: "any", type: "image/x-icon" }],
  };
}
