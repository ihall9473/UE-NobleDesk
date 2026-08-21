import "./globals.css";
import NotificationSetup from "./components/NotificationSetup";

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
  themeColor: "#1a1a2e",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body>
        <nav className="nav">
          <span style={{ color: "#fff", fontWeight: 700, marginRight: 8 }}>UE NobleDesk</span>
          <a href="/leads">Leads</a>
          <a href="/clients">Clients</a>
          <a href="/compose">Send a Text</a>
          <a href="/conversations">Conversations</a>
          <a href="/occasions">Occasions</a>
          <a href="/settings">Settings</a>
          <a href="/admin">Admin</a>
        </nav>
        <main className="main">
          <NotificationSetup />
          {children}
        </main>
      </body>
    </html>
  );
}
