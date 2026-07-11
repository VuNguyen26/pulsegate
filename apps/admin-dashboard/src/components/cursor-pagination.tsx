"use client";

export function CursorPagination({
  description,
  hasPreviousPage,
  hasNextPage,
  busy = false,
  onPrevious,
  onNext,
}: {
  description: string;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  busy?: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <nav
      className="cursor-pagination"
      aria-label="Event pagination"
      aria-busy={busy}
    >
      <span aria-live="polite">{description}</span>

      <div className="cursor-pagination-actions">
        <button
          className="secondary-button"
          type="button"
          disabled={busy || !hasPreviousPage}
          onClick={onPrevious}
        >
          Previous page
        </button>

        <button
          className="secondary-button"
          type="button"
          disabled={busy || !hasNextPage}
          onClick={onNext}
        >
          Next page
        </button>
      </div>
    </nav>
  );
}
