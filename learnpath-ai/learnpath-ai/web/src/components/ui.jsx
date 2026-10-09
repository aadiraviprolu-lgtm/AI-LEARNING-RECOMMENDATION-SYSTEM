import { useEffect } from 'react';

export const Spinner = ({ full }) => (
  <div className={full ? 'spinner-full' : 'spinner-wrap'} role="status" aria-label="Loading"><div className="spinner" /></div>
);

export const Alert = ({ children, kind = 'error', onRetry }) =>
  children ? (
    <div className={`alert alert-${kind}`} role="alert">
      <span>{children}</span>
      {onRetry && <button className="btn btn-sm" onClick={onRetry}>Retry</button>}
    </div>
  ) : null;

export const Badge = ({ value }) => <span className={`badge badge-${String(value).toLowerCase().replace(/\s+/g, '-')}`}>{value}</span>;

export function Field({ label, error, children }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {error && <span className="field-error">{error}</span>}
    </label>
  );
}

export function Modal({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head"><h3>{title}</h3><button className="icon-btn" onClick={onClose} aria-label="Close">✕</button></div>
        {children}
      </div>
    </div>
  );
}

export const Empty = ({ title, hint }) => (
  <div className="empty"><div className="empty-icon">🧭</div><strong>{title}</strong><p>{hint}</p></div>
);
