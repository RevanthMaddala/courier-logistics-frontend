import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { shipmentsApi } from '../api/endpoints';
import { useApi } from '../hooks/useApi';
import { useLookups } from '../hooks/useLookups';
import { EmptyState, ErrorAlert, Loading, PageHeader, Pagination, Select, StatusBadge } from '../components/ui';
import { SHIPMENT_STATUSES } from '../constants';
import { formatDate, formatDateTime, formatWeight } from '../utils/format';

const FILTERS = ['status', 'customerId', 'deliveryAgentId', 'warehouseId'];

export default function ShipmentsPage() {
  // Filters live in the URL so links like /shipments?customerId=3 work and survive reloads.
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { customers, agents, warehouses } = useLookups();
  const page = Number(params.get('page') || 0);
  const filters = Object.fromEntries(FILTERS.map((f) => [f, params.get(f) || '']));

  const { data, error, loading, reload } = useApi(
    () => shipmentsApi.list({ ...filters, page, size: 20, sort: 'createdAt,desc' }),
    [params.toString()],
  );

  const setFilter = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    setParams(next);
  };

  const setPage = (p) => {
    const next = new URLSearchParams(params);
    next.set('page', p);
    setParams(next);
  };

  const hasFilters = FILTERS.some((f) => filters[f]);

  return (
    <>
      <PageHeader
        title="Shipments"
        subtitle="Every booking and where it is now"
        actions={<Link className="btn btn-primary" to="/shipments/new">+ Book shipment</Link>}
      />
      <div className="card">
        <div className="filters">
          <Select value={filters.status} onChange={(v) => setFilter('status', v)} options={SHIPMENT_STATUSES} placeholder="All statuses" />
          <Select
            value={filters.customerId}
            onChange={(v) => setFilter('customerId', v)}
            options={customers.map((c) => ({ value: String(c.id), label: c.name }))}
            placeholder="All customers"
          />
          <Select
            value={filters.deliveryAgentId}
            onChange={(v) => setFilter('deliveryAgentId', v)}
            options={agents.map((a) => ({ value: String(a.id), label: a.name }))}
            placeholder="All agents"
          />
          <Select
            value={filters.warehouseId}
            onChange={(v) => setFilter('warehouseId', v)}
            options={warehouses.map((w) => ({ value: String(w.id), label: w.name }))}
            placeholder="All warehouses"
          />
          {hasFilters && (
            <button className="btn" onClick={() => setParams({})}>Clear filters</button>
          )}
        </div>
        <ErrorAlert error={error} onRetry={reload} />
        {loading && !data ? (
          <Loading />
        ) : data?.content.length === 0 ? (
          <EmptyState>No shipments match these filters.</EmptyState>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Tracking #</th>
                  <th>Customer</th>
                  <th>Route</th>
                  <th>Weight</th>
                  <th>Status</th>
                  <th>Agent</th>
                  <th>Delivery date</th>
                  <th>Booked</th>
                </tr>
              </thead>
              <tbody>
                {data?.content.map((s) => (
                  <tr key={s.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/shipments/${s.id}`)}>
                    <td className="mono"><Link to={`/shipments/${s.id}`}>{s.trackingNumber}</Link></td>
                    <td>{s.customerName}</td>
                    <td>{s.source} → {s.destination}</td>
                    <td>{formatWeight(s.weight)}</td>
                    <td><StatusBadge value={s.status} /></td>
                    <td>{s.deliveryAgentName || <span className="muted">—</span>}</td>
                    <td>{formatDate(s.deliveryDate)}</td>
                    <td className="muted">{formatDateTime(s.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={data} onChange={setPage} />
      </div>
    </>
  );
}
