import "./globals.css";
import NotificationSetup from "./components/NotificationSetup";
import NavBar from "./components/NavBar";
import PageTransition from "./components/PageTransition";
import BackgroundDecals from "./components/BackgroundDecals";
import SuggestionBox from "./components/SuggestionBox";
import { TEXTING_ENABLED, APP_NAME } from "@/lib/features";

export const metadata = {
  title: APP_NAME,
  description: TEXTING_ENABLED
    ? "Send and receive texts with your clients and leads"
    : "Manage your leads and clients",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_NAME,
  },
};

export const viewport = {
  themeColor: "#0e0e0f",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body>
        <BackgroundDecals />
        <NavBar />
        <main className="main">
          <NotificationSetup />
          <PageTransition>{children}</PageTransition>
        </main>
        <SuggestionBox />
      </body>
    </html>
  );
}
