import { Link } from 'react-router-dom';
import { agentsApi, customersApi, paymentsApi, shipmentsApi, warehousesApi } from '../api/endpoints';
import { useApi } from '../hooks/useApi';
import { ErrorAlert, Loading, PageHeader, StatusBadge } from '../components/ui';
import { label, SHIPMENT_STATUSES } from '../constants';
import { formatDateTime } from '../utils/format';

const count = (promise) => promise.then((page) => page.totalElements);

export default function DashboardPage() {
  // The API has no stats endpoint, so totals come from size=1 pages (totalElements).
  const { data, error, loading, reload } = useApi(async () => {
    const [customers, agents, availableAgents, warehouses, shipments, pendingPayments, recent, byStatus] =
      await Promise.all([
        count(customersApi.list({ size: 1 })),
        count(agentsApi.list({ size: 1 })),
        count(agentsApi.list({ size: 1, availability: 'AVAILABLE' })),
        count(warehousesApi.list({ size: 1 })),
        count(shipmentsApi.list({ size: 1 })),
        count(paymentsApi.list({ size: 1, status: 'PENDING' })),
        shipmentsApi.list({ size: 6, sort: 'updatedAt,desc' }),
        Promise.all(SHIPMENT_STATUSES.map((status) => count(shipmentsApi.list({ size: 1, status })))),
      ]);
    return {
      customers,
      agents,
      availableAgents,
      warehouses,
      shipments,
      pendingPayments,
      recent: recent.content,
      byStatus: SHIPMENT_STATUSES.map((status, i) => ({ status, count: byStatus[i] })),
    };
  }, []);

  if (loading && !data) return <Loading />;
  if (error && !data) return <ErrorAlert error={error} onRetry={reload} />;

  const max = Math.max(1, ...data.byStatus.map((s) => s.count));
  const active = data.byStatus
    .filter((s) => !['DELIVERED', 'RETURNED', 'CANCELLED'].includes(s.status))
    .reduce((sum, s) => sum + s.count, 0);

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Today's view of the network"
        actions={<Link className="btn btn-primary" to="/shipments/new">+ Book shipment</Link>}
      />

      <div className="stats">
        <Stat to="/shipments" value={data.shipments} label="Shipments" />
        <Stat to="/shipments" value={active} label="Active shipments" />
        <Stat to="/customers" value={data.customers} label="Customers" />
        <Stat to="/agents" value={`${data.availableAgents}/${data.agents}`} label="Agents available" />
        <Stat to="/warehouses" value={data.warehouses} label="Warehouses" />
        <Stat to="/payments" value={data.pendingPayments} label="Pending payments" />
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h2 style={{ marginBottom: 12 }}>Shipments by status</h2>
          <div className="status-bars">
            {data.byStatus.map((s) => (
              <Link key={s.status} to={`/shipments?status=${s.status}`} className="status-bar" style={{ color: 'inherit' }}>
                <span>{label(s.status)}</span>
                <span className="status-bar-track">
                  <span className="status-bar-fill" style={{ width: `${(s.count / max) * 100}%`, display: 'block' }} />
                </span>
                <strong style={{ textAlign: 'right' }}>{s.count}</strong>
              </Link>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>Recently updated</h2>
            <Link to="/shipments">View all</Link>
          </div>
          {data.recent.length === 0 ? (
            <p className="muted">No shipments yet.</p>
          ) : (
            <div className="table-wrap">
              <table className="compact">
                <tbody>
                  {data.recent.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <Link className="mono" to={`/shipments/${s.id}`}>{s.trackingNumber}</Link>
                        <div className="muted" style={{ fontSize: 12 }}>{s.source} → {s.destination}</div>
                      </td>
                      <td><StatusBadge value={s.status} /></td>
                      <td className="muted">{formatDateTime(s.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function Stat({ to, value, label: text }) {
  return (
    <Link to={to} className="stat">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{text}</div>
    </Link>
  );
}
