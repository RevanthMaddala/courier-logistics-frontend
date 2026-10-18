import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { trackingApi } from '../api/endpoints';
import Timeline from '../components/Timeline';
import { ErrorAlert, Loading, PageHeader, StatusBadge } from '../components/ui';
import { formatDate } from '../utils/format';

/** Customer-facing lookup: route, status and history only. */
export default function TrackPage() {
  const { trackingNumber } = useParams();
  const navigate = useNavigate();
  const [input, setInput] = useState(trackingNumber || '');
  const [state, setState] = useState({ data: null, error: null, loading: false });

  useEffect(() => {
    if (!trackingNumber) {
      setState({ data: null, error: null, loading: false });
      return;
    }
    setInput(trackingNumber);
    let cancelled = false;
    setState({ data: null, error: null, loading: true });
    trackingApi
      .track(trackingNumber)
      .then((data) => !cancelled && setState({ data, error: null, loading: false }))
      .catch((error) => !cancelled && setState({ data: null, error, loading: false }));
    return () => {
      cancelled = true;
    };
  }, [trackingNumber]);

  const submit = (e) => {
    e.preventDefault();
    const value = input.trim();
    if (value) navigate(`/track/${encodeURIComponent(value)}`);
  };

  const { data, error, loading } = state;
  return (
    <>
      <PageHeader title="Track a shipment" subtitle="Enter the tracking number from your booking receipt" />
      <form className="track-form" onSubmit={submit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. CLT20261018ULNFAWGR"
          aria-label="Tracking number"
          autoFocus
        />
        <button className="btn btn-primary">Track</button>
      </form>

      <div style={{ marginTop: 20 }}>
        {loading && <Loading text="Looking up shipment…" />}
        {error && (
          <ErrorAlert
            error={error.status === 404 ? { message: 'No shipment found with that tracking number.' } : error}
          />
        )}
        {data && (
          <div className="card">
            <div className="card-header">
              <span className="mono">{data.trackingNumber}</span>
              <StatusBadge value={data.currentStatus} />
            </div>
            <div className="route">
              <span>{data.source}</span>
              <span className="muted">→</span>
              <span>{data.destination}</span>
            </div>
            <p className="muted" style={{ marginTop: 0 }}>
              {data.currentStatus === 'DELIVERED' ? 'Delivered on ' : 'Expected delivery: '}
              {formatDate(data.deliveryDate)}
            </p>
            <h3>History</h3>
            <Timeline entries={data.history} />
          </div>
        )}
      </div>
    </>
  );
}
