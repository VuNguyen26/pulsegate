import Link from "next/link";

export default function NotFound() {
  return (
    <section className="page-stack">
      <header className="page-header">
        <p className="eyebrow">404</p>
        <h1>Page not found</h1>
        <p>The requested Admin Dashboard section does not exist.</p>
      </header>

      <Link className="primary-button" href="/">
        Return to overview
      </Link>
    </section>
  );
}