import { useEffect } from 'react';
import { label } from '../constants';

export function StatusBadge({ value }) {
  if (!value) return <span className="muted">—</span>;
  return <span className={`badge badge-${value.toLowerCase()}`}>{label(value)}</span>;
}

export function ErrorAlert({ error, onRetry }) {
  if (!error) return null;
  return (
    <div className="alert alert-error" role="alert">
      <span>{error.message}</span>
      {onRetry && (
        <button type="button" className="btn btn-small" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}

export function Loading({ text = 'Loading…' }) {
  return <div className="loading">{text}</div>;
}

export function EmptyState({ children }) {
  return <div className="empty">{children}</div>;
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}

export function Pagination({ page, onChange }) {
  if (!page || page.totalPages <= 1) return null;
  return (
    <div className="pagination">
      <button className="btn btn-small" disabled={page.page === 0} onClick={() => onChange(page.page - 1)}>
        ‹ Prev
      </button>
      <span className="muted">
        Page {page.page + 1} of {page.totalPages} · {page.totalElements} total
      </span>
      <button className="btn btn-small" disabled={page.last} onClick={() => onChange(page.page + 1)}>
        Next ›
      </button>
    </div>
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
        <div className="modal-header">
          <h2>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Labelled input that shows the backend's validation message for `name`, if any. */
export function Field({ label: text, name, errors, hint, children }) {
  const message = errors?.[name];
  return (
    <label className={`field ${message ? 'field-invalid' : ''}`}>
      <span className="field-label">{text}</span>
      {children}
      {message ? <span className="field-error">{message}</span> : hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

export function Select({ value, onChange, options, placeholder, ...rest }) {
  return (
    <select value={value ?? ''} onChange={(e) => onChange(e.target.value)} {...rest}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => {
        const opt = typeof o === 'string' ? { value: o, label: label(o) } : o;
        return (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        );
      })}
    </select>
  );
}
