"use client";

export default function ErrorPage({
  reset,
}: {
  reset: () => void;
}) {
  return (
    <section className="page-stack content-page">
      <p className="eyebrow">Portal error</p>
      <h1>Unable to render this page</h1>
      <p>No internal configuration or credentials were exposed.</p>
      <button type="button" className="primary-link" onClick={reset}>
        Try again
      </button>
    </section>
  );
}
