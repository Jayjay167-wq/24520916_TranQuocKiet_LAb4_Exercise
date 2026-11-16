import './PersonDetail.css';

// Same grid and row heights as PersonDetail's <dl>, so the swap causes no layout shift.
export default function PersonDetailSkeleton() {
  return (
    <div className="person-details person-details--skeleton" aria-busy="true" aria-live="polite">
      <span className="visually-hidden">Loading person…</span>
      {['Name', 'Role'].map((label) => (
        <div key={label} className="skeleton-row" aria-hidden="true">
          <span className="skeleton-bar skeleton-bar--term" />
          <span className="skeleton-bar skeleton-bar--value" />
        </div>
      ))}
    </div>
  );
}
