import { TEXTING_ENABLED, APP_NAME } from "@/lib/features";

export default function manifest() {
  return {
    name: APP_NAME,
    short_name: APP_NAME === "UE NobleDesk" ? "NobleDesk" : "NobleDesk CRM",
    description: TEXTING_ENABLED
      ? "Send and receive texts with your clients and leads"
      : "Manage your leads and clients",
    start_url: "/leads",
    display: "standalone",
    background_color: "#f7f7f8",
    theme_color: "#1a1a2e",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
