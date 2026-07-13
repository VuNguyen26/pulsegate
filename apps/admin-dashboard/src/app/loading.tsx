export default function Loading() {
  return (
    <section className="page-stack" role="status" aria-live="polite" aria-busy="true">
      <p className="eyebrow">Loading</p>
      <div className="loading-block" />
      <div className="loading-block loading-block-short" />
    </section>
  );
}