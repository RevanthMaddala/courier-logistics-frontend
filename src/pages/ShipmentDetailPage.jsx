import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { packagesApi, paymentsApi, shipmentsApi } from '../api/endpoints';
import { useApi, useMutation } from '../hooks/useApi';
import { useLookups } from '../hooks/useLookups';
import { useToast } from '../components/Toast';
import Timeline from '../components/Timeline';
import PackageFields, { EMPTY_PACKAGE, toPackageBody } from '../components/PackageFields';
import { ErrorAlert, Field, Loading, Modal, PageHeader, Select, StatusBadge } from '../components/ui';
import {
  label, PAYMENT_METHODS, PAYMENT_TRANSITIONS, SHIPMENT_TRANSITIONS, TERMINAL_STATUSES,
} from '../constants';
import { formatDate, formatDateTime, formatMoney, formatWeight, todayIso } from '../utils/format';

export default function ShipmentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const notify = useToast();
  const [editing, setEditing] = useState(false);

  // Shipment, its history and its payment are loaded together and refreshed after every action.
  const { data, error, loading, reload } = useApi(
    () =>
      Promise.all([
        shipmentsApi.get(id),
        shipmentsApi.history(id),
        paymentsApi.forShipment(id).catch((err) => {
          if (err.status === 404) return null;
          throw err;
        }),
      ]).then(([shipment, history, payment]) => ({ shipment, history, payment })),
    [id],
  );

  if (loading && !data) return <Loading />;
  if (error && !data) return <ErrorAlert error={error} onRetry={reload} />;

  const { shipment, history, payment } = data;
  const isCreated = shipment.status === 'CREATED';
  const isTerminal = TERMINAL_STATUSES.includes(shipment.status);
  const canDelete = isCreated || shipment.status === 'CANCELLED';

  const remove = async () => {
    if (!window.confirm(`Delete shipment ${shipment.trackingNumber}? This cannot be undone.`)) return;
    try {
      await shipmentsApi.remove(shipment.id);
      notify('Shipment deleted');
      navigate('/shipments');
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  return (
    <>
      <PageHeader
        title={<span className="mono" style={{ fontSize: 20 }}>{shipment.trackingNumber}</span>}
        subtitle={<>{shipment.source} → {shipment.destination} · <StatusBadge value={shipment.status} /></>}
        actions={
          <>
            <Link className="btn" to={`/track/${shipment.trackingNumber}`}>Public view</Link>
            {isCreated && <button className="btn" onClick={() => setEditing(true)}>Edit details</button>}
            {canDelete && <button className="btn btn-danger" onClick={remove}>Delete</button>}
          </>
        }
      />
      <ErrorAlert error={error} onRetry={reload} />

      <div className="grid grid-2">
        <div className="card">
          <h2 style={{ marginBottom: 12 }}>Details</h2>
          <dl className="details">
            <dt>Customer</dt>
            <dd><Link to={`/shipments?customerId=${shipment.customerId}`}>{shipment.customerName}</Link></dd>
            <dt>Weight</dt>
            <dd>{formatWeight(shipment.weight)}</dd>
            <dt>Booked</dt>
            <dd>{formatDateTime(shipment.shipmentDateTime)}</dd>
            <dt>{shipment.status === 'DELIVERED' ? 'Delivered on' : 'Expected delivery'}</dt>
            <dd>{formatDate(shipment.deliveryDate)}</dd>
            <dt>Delivery agent</dt>
            <dd>{shipment.deliveryAgentName || <span className="muted">Not assigned</span>}</dd>
            <dt>Warehouse</dt>
            <dd>{shipment.warehouseName || <span className="muted">Not assigned</span>}</dd>
            <dt>Last updated</dt>
            <dd>{formatDateTime(shipment.updatedAt)}</dd>
          </dl>
        </div>

        <div>
          {!isTerminal && <StatusCard key={shipment.status} shipment={shipment} onDone={reload} />}
          {!isTerminal && <AssignmentCard shipment={shipment} onDone={reload} />}
          {isTerminal && (
            <div className="card">
              <h2>Shipment closed</h2>
              <p className="muted" style={{ marginBottom: 0 }}>
                This shipment is {label(shipment.status).toLowerCase()}; no further status changes are possible.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-header">
            <h2>Tracking history</h2>
          </div>
          {!isTerminal && <CheckpointForm shipmentId={shipment.id} onDone={reload} />}
          <Timeline entries={history} />
        </div>
        <PaymentCard shipment={shipment} payment={payment} onDone={reload} />
      </div>

      <PackagesCard shipment={shipment} editable={isCreated} onDone={reload} />

      {editing && (
        <EditShipmentModal
          shipment={shipment}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            reload();
          }}
        />
      )}
    </>
  );
}

function StatusCard({ shipment, onDone }) {
  const notify = useToast();
  const options = SHIPMENT_TRANSITIONS[shipment.status];
  const [form, setForm] = useState({ status: options[0], location: '', remarks: '' });
  const save = useMutation((body) => shipmentsApi.updateStatus(shipment.id, body));

  const needsAgent = form.status === 'OUT_FOR_DELIVERY' && !shipment.deliveryAgentId;
  const needsWarehouse = form.status === 'IN_WAREHOUSE' && !shipment.warehouseId;

  const submit = async (e) => {
    e.preventDefault();
    try {
      await save.run(form);
      notify(`Status changed to ${label(form.status)}`);
      onDone();
    } catch {
      /* shown inline */
    }
  };

  return (
    <div className="card">
      <h2 style={{ marginBottom: 12 }}>Update status</h2>
      <form className="form" onSubmit={submit}>
        {save.error && <ErrorAlert error={save.error} />}
        <div className="form-row">
          <Field label="New status" name="status" errors={save.error?.fieldErrors}>
            <Select value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={options} />
          </Field>
          <Field label="Location" name="location" errors={save.error?.fieldErrors}>
            <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required placeholder="Where it happened" />
          </Field>
        </div>
        <Field label="Remarks (optional)" name="remarks" errors={save.error?.fieldErrors}>
          <input value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} maxLength={500} />
        </Field>
        {needsAgent && <p className="field-error">Assign a delivery agent first.</p>}
        {needsWarehouse && <p className="field-error">Assign a warehouse first.</p>}
        <div className="form-actions">
          <button className="btn btn-primary" disabled={save.pending || needsAgent || needsWarehouse}>
            {save.pending ? 'Updating…' : 'Update status'}
          </button>
        </div>
      </form>
    </div>
  );
}

function AssignmentCard({ shipment, onDone }) {
  const notify = useToast();
  const { agents, warehouses } = useLookups();
  const [agentId, setAgentId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const assign = useMutation(async (kind, targetId) =>
    kind === 'agent'
      ? shipmentsApi.assignAgent(shipment.id, targetId)
      : shipmentsApi.assignWarehouse(shipment.id, targetId),
  );
  const lockedAgent = shipment.status === 'OUT_FOR_DELIVERY';

  const run = async (kind, targetId) => {
    try {
      await assign.run(kind, targetId);
      notify(kind === 'agent' ? 'Delivery agent assigned' : 'Warehouse assigned');
      setAgentId('');
      setWarehouseId('');
      onDone();
    } catch {
      /* shown inline */
    }
  };

  return (
    <div className="card">
      <h2 style={{ marginBottom: 12 }}>Assignments</h2>
      {assign.error && <ErrorAlert error={assign.error} />}
      <div className="form">
        <Field label={`Delivery agent${shipment.deliveryAgentName ? ` (current: ${shipment.deliveryAgentName})` : ''}`}>
          <div style={{ display: 'flex', gap: 8 }}>
            <Select
              value={agentId}
              onChange={setAgentId}
              disabled={lockedAgent}
              options={agents
                .filter((a) => a.availability !== 'OFF_DUTY' && a.id !== shipment.deliveryAgentId)
                .map((a) => ({ value: String(a.id), label: `${a.name} · ${label(a.availability)} · ★${a.rating}` }))}
              placeholder={lockedAgent ? 'Locked while out for delivery' : 'Choose an agent…'}
            />
            <button className="btn" disabled={!agentId || assign.pending} onClick={() => run('agent', agentId)}>Assign</button>
          </div>
        </Field>
        <Field label={`Warehouse${shipment.warehouseName ? ` (current: ${shipment.warehouseName})` : ''}`}>
          <div style={{ display: 'flex', gap: 8 }}>
            <Select
              value={warehouseId}
              onChange={setWarehouseId}
              options={warehouses
                .filter((w) => w.id !== shipment.warehouseId)
                .map((w) => ({ value: String(w.id), label: `${w.name} · ${w.location}` }))}
              placeholder="Choose a warehouse…"
            />
            <button className="btn" disabled={!warehouseId || assign.pending} onClick={() => run('warehouse', warehouseId)}>Assign</button>
          </div>
        </Field>
      </div>
    </div>
  );
}

function CheckpointForm({ shipmentId, onDone }) {
  const notify = useToast();
  const [location, setLocation] = useState('');
  const [remarks, setRemarks] = useState('');
  const save = useMutation((body) => shipmentsApi.addCheckpoint(shipmentId, body));

  const submit = async (e) => {
    e.preventDefault();
    try {
      await save.run({ location, remarks });
      notify('Checkpoint added');
      setLocation('');
      setRemarks('');
      onDone();
    } catch {
      /* shown inline */
    }
  };

  return (
    <form className="form" onSubmit={submit} style={{ marginBottom: 16 }}>
      {save.error && <ErrorAlert error={save.error} />}
      <div className="form-row">
        <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Checkpoint location" required />
        <input value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Remarks (optional)" />
      </div>
      <div className="form-actions">
        <button className="btn btn-small" disabled={save.pending}>+ Add checkpoint</button>
      </div>
    </form>
  );
}

function PaymentCard({ shipment, payment, onDone }) {
  const notify = useToast();
  const [form, setForm] = useState({ amount: '', paymentMethod: 'UPI' });
  const create = useMutation((body) => paymentsApi.create(shipment.id, body));
  const update = useMutation((status) => paymentsApi.updateStatus(payment.id, status));

  const submit = async (e) => {
    e.preventDefault();
    try {
      await create.run({ amount: Number(form.amount), paymentMethod: form.paymentMethod });
      notify('Payment recorded');
      onDone();
    } catch {
      /* shown inline */
    }
  };

  const changeStatus = async (status) => {
    try {
      await update.run(status);
      notify(`Payment marked ${label(status).toLowerCase()}`);
      onDone();
    } catch {
      /* shown inline */
    }
  };

  return (
    <div className="card">
      <h2 style={{ marginBottom: 12 }}>Payment</h2>
      {payment ? (
        <>
          <dl className="details">
            <dt>Amount</dt>
            <dd><strong>{formatMoney(payment.amount)}</strong></dd>
            <dt>Method</dt>
            <dd>{label(payment.paymentMethod)}</dd>
            <dt>Status</dt>
            <dd><StatusBadge value={payment.paymentStatus} /></dd>
            <dt>Date</dt>
            <dd>{formatDateTime(payment.paymentDateTime)}</dd>
          </dl>
          {update.error && <ErrorAlert error={update.error} />}
          {PAYMENT_TRANSITIONS[payment.paymentStatus].length > 0 && (
            <div className="form-actions" style={{ justifyContent: 'flex-start', marginTop: 12 }}>
              {PAYMENT_TRANSITIONS[payment.paymentStatus].map((s) => (
                <button
                  key={s}
                  className={`btn btn-small ${s === 'COMPLETED' ? 'btn-primary' : ''}`}
                  disabled={update.pending}
                  onClick={() => changeStatus(s)}
                >
                  Mark {label(s).toLowerCase()}
                </button>
              ))}
            </div>
          )}
        </>
      ) : shipment.status === 'CANCELLED' ? (
        <p className="muted">No payment. Cancelled shipments can't take payments.</p>
      ) : (
        <form className="form" onSubmit={submit}>
          <p className="muted" style={{ margin: 0 }}>No payment recorded yet.</p>
          {create.error && !Object.keys(create.error.fieldErrors).length && <ErrorAlert error={create.error} />}
          <div className="form-row">
            <Field label="Amount (₹)" name="amount" errors={create.error?.fieldErrors}>
              <input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
            </Field>
            <Field label="Method" name="paymentMethod" errors={create.error?.fieldErrors}>
              <Select value={form.paymentMethod} onChange={(v) => setForm({ ...form, paymentMethod: v })} options={PAYMENT_METHODS} />
            </Field>
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" disabled={create.pending}>Record payment</button>
          </div>
        </form>
      )}
    </div>
  );
}

function PackagesCard({ shipment, editable, onDone }) {
  const notify = useToast();
  const [draft, setDraft] = useState(null); // { id?, ...fields }
  const save = useMutation((pkg) =>
    pkg.id
      ? packagesApi.update(shipment.id, pkg.id, toPackageBody(pkg))
      : packagesApi.create(shipment.id, toPackageBody(pkg)),
  );

  const submit = async (e) => {
    e.preventDefault();
    try {
      await save.run(draft);
      notify(draft.id ? 'Package updated' : 'Package added');
      setDraft(null);
      onDone();
    } catch {
      /* shown inline */
    }
  };

  const remove = async (pkg) => {
    if (!window.confirm('Remove this package?')) return;
    try {
      await packagesApi.remove(shipment.id, pkg.id);
      notify('Package removed');
      onDone();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2>Packages ({shipment.packages.length})</h2>
        {editable && !draft && (
          <button className="btn btn-small" onClick={() => setDraft({ ...EMPTY_PACKAGE })}>+ Add package</button>
        )}
      </div>
      {!editable && <p className="muted" style={{ marginTop: 0 }}>Packages are locked once the shipment is picked up.</p>}
      {draft && (
        <form className="form" onSubmit={submit} style={{ marginBottom: 12 }}>
          {save.error && <ErrorAlert error={save.error} />}
          <PackageFields value={draft} onChange={setDraft} errors={save.error?.fieldErrors} />
          <div className="form-actions">
            <button type="button" className="btn" onClick={() => setDraft(null)}>Cancel</button>
            <button className="btn btn-primary" disabled={save.pending}>Save package</button>
          </div>
        </form>
      )}
      {shipment.packages.length === 0 ? (
        <p className="muted">No packages.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Dimensions (L × W × H cm)</th>
                <th>Fragile</th>
                {editable && <th />}
              </tr>
            </thead>
            <tbody>
              {shipment.packages.map((p) => (
                <tr key={p.id}>
                  <td>{label(p.packageType)}</td>
                  <td>{Number(p.lengthCm)} × {Number(p.widthCm)} × {Number(p.heightCm)}</td>
                  <td>{p.fragile ? <span className="tag">FRAGILE</span> : <span className="muted">No</span>}</td>
                  {editable && (
                    <td className="actions">
                      <button className="btn btn-small" onClick={() => setDraft({ ...p })}>Edit</button>
                      <button className="btn btn-small btn-danger" onClick={() => remove(p)}>Remove</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function EditShipmentModal({ shipment, onClose, onSaved }) {
  const notify = useToast();
  const [form, setForm] = useState({
    source: shipment.source,
    destination: shipment.destination,
    weight: String(shipment.weight),
    deliveryDate: shipment.deliveryDate || '',
  });
  const save = useMutation((body) => shipmentsApi.update(shipment.id, body));
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    try {
      await save.run({ ...form, weight: Number(form.weight), deliveryDate: form.deliveryDate || null });
      notify('Shipment updated');
      onSaved();
    } catch {
      /* shown inline */
    }
  };

  const errors = save.error?.fieldErrors;
  return (
    <Modal title="Edit shipment" onClose={onClose}>
      <form className="form" onSubmit={submit}>
        {save.error && !Object.keys(errors).length && <ErrorAlert error={save.error} />}
        <Field label="Source" name="source" errors={errors}>
          <input value={form.source} onChange={set('source')} required />
        </Field>
        <Field label="Destination" name="destination" errors={errors}>
          <input value={form.destination} onChange={set('destination')} required />
        </Field>
        <div className="form-row">
          <Field label="Weight (kg)" name="weight" errors={errors}>
            <input type="number" min="0.001" step="0.001" value={form.weight} onChange={set('weight')} required />
          </Field>
          <Field label="Expected delivery" name="deliveryDate" errors={errors}>
            <input type="date" min={todayIso()} value={form.deliveryDate} onChange={set('deliveryDate')} />
          </Field>
        </div>
        <div className="form-actions">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={save.pending}>Save</button>
        </div>
      </form>
    </Modal>
  );
}
