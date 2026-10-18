import { useState } from 'react';
import { Link } from 'react-router-dom';
import { paymentsApi } from '../api/endpoints';
import { useApi } from '../hooks/useApi';
import { EmptyState, ErrorAlert, Loading, PageHeader, Pagination, Select, StatusBadge } from '../components/ui';
import { label, PAYMENT_STATUSES } from '../constants';
import { formatDateTime, formatMoney } from '../utils/format';

export default function PaymentsPage() {
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState('');

  const { data, error, loading, reload } = useApi(
    () => paymentsApi.list({ status, page, size: 20, sort: 'id,desc' }),
    [status, page],
  );

  return (
    <>
      <PageHeader title="Payments" subtitle="Payments are recorded and updated from each shipment's page" />
      <div className="card">
        <div className="filters">
          <Select
            value={status}
            onChange={(v) => {
              setStatus(v);
              setPage(0);
            }}
            options={PAYMENT_STATUSES}
            placeholder="All statuses"
          />
        </div>
        <ErrorAlert error={error} onRetry={reload} />
        {loading && !data ? (
          <Loading />
        ) : data?.content.length === 0 ? (
          <EmptyState>No payments found.</EmptyState>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Shipment</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {data?.content.map((p) => (
                  <tr key={p.id}>
                    <td className="mono"><Link to={`/shipments/${p.shipmentId}`}>{p.trackingNumber}</Link></td>
                    <td>{formatMoney(p.amount)}</td>
                    <td>{label(p.paymentMethod)}</td>
                    <td><StatusBadge value={p.paymentStatus} /></td>
                    <td className="muted">{formatDateTime(p.paymentDateTime)}</td>
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
