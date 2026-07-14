import type { Metadata } from "next";

import { PortalNavigation } from "@/components/portal-navigation";

import "./globals.css";
import "./visual-system.css";

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
          <div className="site-header-inner">
            <LinkBrand />
            <PortalNavigation />
            <a
              className="header-status-link"
              href="https://pulsegate-public-demo-api.onrender.com/health"
            >
              <span aria-hidden="true" />
              API status
            </a>
          </div>
        </header>

        <main>{children}</main>

        <footer className="site-footer">
          <div className="site-footer-inner">
            <div className="footer-brand">
              <LinkBrand />
              <p>
                An inspectable API gateway portfolio built around secure
                routing, bounded operations, and observable runtime behavior.
              </p>
            </div>

            <nav aria-label="Product links">
              <strong>Product</strong>
              <a href="/getting-started">Getting started</a>
              <a href="/api-docs">API documentation</a>
              <a href="/api-keys">API-key boundary</a>
            </nav>

            <nav aria-label="Public demo links">
              <strong>Public demo</strong>
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
          </div>

          <div className="site-footer-meta">
            <span>PulseGate public portfolio demo</span>
            <span>v2.0.0 · Read-only boundary</span>
          </div>
        </footer>
      </body>
    </html>
  );
}

function LinkBrand() {
  return (
    <a className="brand" href="/">
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 32 32" role="img">
          <path d="M7 8.5h9.5a7.5 7.5 0 0 1 0 15H7z" />
          <path d="M12 13.5h4.5a2.5 2.5 0 0 1 0 5H12z" />
        </svg>
      </span>
      <span className="brand-copy">
        <strong>PulseGate</strong>
        <span>Developer Platform</span>
      </span>
    </a>
  );
}
