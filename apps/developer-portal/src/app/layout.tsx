import type { Metadata } from "next";

import { PortalNavigation } from "@/components/portal-navigation";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "PulseGate Developer Portal",
    template: "%s | PulseGate Developer Portal",
  },
  description: "Public developer-facing foundation for PulseGate.",
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
        <footer>PulseGate Developer Portal · Sprint 66 developer foundations</footer>
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
