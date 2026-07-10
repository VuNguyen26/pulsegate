import type { Metadata } from "next";

import { SidebarNavigation } from "@/components/sidebar-navigation";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "PulseGate Admin",
    template: "%s | PulseGate Admin",
  },
  description: "Secure administration interface for PulseGate.",
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
            <div>
              <span className="product-name">PulseGate</span>
              <span className="product-area">Admin Dashboard</span>
            </div>
            <span className="foundation-badge">
              Foundation
            </span>
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