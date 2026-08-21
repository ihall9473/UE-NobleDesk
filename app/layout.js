import "./globals.css";
import NotificationSetup from "./components/NotificationSetup";
import NavBar from "./components/NavBar";
import PageTransition from "./components/PageTransition";
import BackgroundDecals from "./components/BackgroundDecals";

export const metadata = {
  title: "UE NobleDesk",
  description: "Send and receive texts with your clients and leads",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "UE NobleDesk",
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
      </body>
    </html>
  );
}
