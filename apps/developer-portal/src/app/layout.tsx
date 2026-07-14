import type { Metadata } from "next";

import { PortalNavigation } from "@/components/portal-navigation";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "PulseGate Developer Portal",
    template: "%s | PulseGate Developer Portal",
  },
  description:
    "Public documentation and integration guidance for the PulseGate API Gateway.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <LinkBrand />
          <PortalNavigation />
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <div>
            <strong>PulseGate</strong>
            <span>Public portfolio demo Â· v2.0.0</span>
          </div>
          <nav aria-label="Public demo links">
            <a href="https://pulsegate-admin-dashboard.netlify.app">
              Admin Dashboard
            </a>
            <a href="https://pulsegate-public-demo-api.onrender.com/health">
              API health
            </a>
            <a href="https://github.com/VuNguyen26/pulsegate">
              Source code
            </a>
          </nav>
        </footer>
      </body>
    </html>
  );
}

function LinkBrand() {
  return (
    <a className="brand" href="/">
      <strong>PulseGate</strong>
      <span>Developer Portal</span>
    </a>
  );
}
