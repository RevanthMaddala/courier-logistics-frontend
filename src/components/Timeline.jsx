import { StatusBadge } from './ui';
import { formatDateTime } from '../utils/format';

/** Tracking history, newest first. */
export default function Timeline({ entries }) {
  if (!entries?.length) return <p className="muted">No tracking events yet.</p>;
  const newestFirst = [...entries].reverse();
  return (
    <ol className="timeline">
      {newestFirst.map((e) => (
        <li key={e.id}>
          <span className="timeline-dot" aria-hidden="true" />
          <div className="timeline-head">
            <strong>{e.location}</strong>
            <StatusBadge value={e.status} />
          </div>
          {e.remarks && <div>{e.remarks}</div>}
          <div className="timeline-meta">{formatDateTime(e.timestamp)}</div>
        </li>
      ))}
    </ol>
  );
}
