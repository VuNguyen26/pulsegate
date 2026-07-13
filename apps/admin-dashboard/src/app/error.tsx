"use client";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="page-stack" role="alert">
      <header className="page-header">
        <p className="eyebrow">Dashboard error</p>
        <h1>Unable to render this page</h1>
        <p>The failure did not expose internal configuration.</p>
      </header>

      <button className="primary-button" type="button" onClick={reset}>
        Try again
      </button>
    </section>
  );
}