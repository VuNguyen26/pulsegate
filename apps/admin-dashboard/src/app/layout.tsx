import type { Metadata } from "next";

import { SidebarNavigation } from "@/components/sidebar-navigation";

import "./globals.css";
import "./visual-system.css";

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
            <a className="product-lockup" href="/">
              <span className="product-mark" aria-hidden="true">
                <svg viewBox="0 0 32 32" role="img">
                  <path d="M7 8.5h9.5a7.5 7.5 0 0 1 0 15H7z" />
                  <path d="M12 13.5h4.5a2.5 2.5 0 0 1 0 5H12z" />
                </svg>
              </span>
              <span className="product-lockup-copy">
                <strong className="product-name">PulseGate</strong>
                <span className="product-area">Admin control plane</span>
              </span>
            </a>

            <div className="top-bar-actions">
              <span className="environment-chip">
                <span aria-hidden="true" />
                Public demo
              </span>
              <span className="foundation-badge">Read only</span>
              <a
                className="top-bar-link"
                href="https://pulsegate-developer-portal.netlify.app"
              >
                Developer Portal
                <span aria-hidden="true">↗</span>
              </a>
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
