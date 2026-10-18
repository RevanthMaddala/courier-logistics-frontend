// The backend stores and returns timestamps in UTC without a zone suffix.
function parseUtc(value) {
  if (!value) return null;
  return new Date(/[zZ]|[+-]\d\d:\d\d$/.test(value) ? value : `${value}Z`);
}

export function formatDateTime(value) {
  const date = parseUtc(value);
  return date
    ? date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
    : '—';
}

export function formatDate(value) {
  if (!value) return '—';
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { dateStyle: 'medium' });
}

export function formatMoney(value) {
  if (value === null || value === undefined) return '—';
  return Number(value).toLocaleString(undefined, { style: 'currency', currency: 'INR' });
}

export function formatWeight(value) {
  return value === null || value === undefined ? '—' : `${Number(value)} kg`;
}

export function todayIso() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now - offset).toISOString().slice(0, 10);
}
