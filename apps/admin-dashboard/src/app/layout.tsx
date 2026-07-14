import type { Metadata } from "next";

import { SidebarNavigation } from "@/components/sidebar-navigation";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "PulseGate Admin",
    template: "%s | PulseGate Admin",
  },
  description:
    "Read-only public administration interface for PulseGate.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="application-shell">
          <header className="top-bar">
            <div className="product-lockup">
              <span className="product-name">PulseGate</span>
              <span className="product-area">Admin Dashboard</span>
            </div>

            <div className="top-bar-actions">
              <a
                className="top-bar-link"
                href="https://pulsegate-developer-portal.netlify.app"
              >
                Developer Portal
              </a>
              <span className="foundation-badge">v2.0.0</span>
            </div>
          </header>

          <aside className="sidebar">
            <SidebarNavigation />
          </aside>

          <main className="main-content">{children}</main>
        </div>
      </body>
    </html>
  );
}