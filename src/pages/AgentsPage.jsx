import { useState } from 'react';
import { Link } from 'react-router-dom';
import { agentsApi } from '../api/endpoints';
import { useApi, useMutation } from '../hooks/useApi';
import { useToast } from '../components/Toast';
import {
  EmptyState, ErrorAlert, Field, Loading, Modal, PageHeader, Pagination, Select, StatusBadge,
} from '../components/ui';
import { AGENT_AVAILABILITY } from '../constants';

const EMPTY = { name: '', contactNumber: '', vehicleNumber: '', availability: 'AVAILABLE', rating: '' };

export default function AgentsPage() {
  const [page, setPage] = useState(0);
  const [availability, setAvailability] = useState('');
  const [editing, setEditing] = useState(null);
  const notify = useToast();

  const { data, error, loading, reload } = useApi(
    () => agentsApi.list({ availability, page, size: 20, sort: 'id,asc' }),
    [availability, page],
  );

  const toggleDuty = async (agent) => {
    const next = agent.availability === 'OFF_DUTY' ? 'AVAILABLE' : 'OFF_DUTY';
    try {
      await agentsApi.setAvailability(agent.id, next);
      notify(`${agent.name} is now ${next === 'OFF_DUTY' ? 'off duty' : 'available'}`);
      reload();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const remove = async (agent) => {
    if (!window.confirm(`Delete delivery agent "${agent.name}"?`)) return;
    try {
      await agentsApi.remove(agent.id);
      notify('Delivery agent deleted');
      reload();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  return (
    <>
      <PageHeader
        title="Delivery agents"
        subtitle="Couriers who carry shipments to their destination"
        actions={<button className="btn btn-primary" onClick={() => setEditing('new')}>+ New agent</button>}
      />
      <div className="card">
        <div className="filters">
          <Select
            value={availability}
            onChange={(v) => {
              setAvailability(v);
              setPage(0);
            }}
            options={AGENT_AVAILABILITY}
            placeholder="All availability"
          />
        </div>
        <ErrorAlert error={error} onRetry={reload} />
        {loading && !data ? (
          <Loading />
        ) : data?.content.length === 0 ? (
          <EmptyState>No delivery agents found.</EmptyState>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Vehicle</th>
                  <th>Availability</th>
                  <th>Rating</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data?.content.map((a) => (
                  <tr key={a.id}>
                    <td>{a.name}</td>
                    <td>{a.contactNumber}</td>
                    <td className="mono">{a.vehicleNumber}</td>
                    <td><StatusBadge value={a.availability} /></td>
                    <td>★ {Number(a.rating).toFixed(1)}</td>
                    <td className="actions">
                      <Link className="btn btn-small" to={`/shipments?deliveryAgentId=${a.id}`}>Shipments</Link>
                      {a.availability !== 'ON_DELIVERY' && (
                        <button className="btn btn-small" onClick={() => toggleDuty(a)}>
                          {a.availability === 'OFF_DUTY' ? 'Set available' : 'Set off duty'}
                        </button>
                      )}
                      <button className="btn btn-small" onClick={() => setEditing(a)}>Edit</button>
                      <button className="btn btn-small btn-danger" onClick={() => remove(a)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={data} onChange={setPage} />
      </div>

      {editing && (
        <AgentForm
          agent={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      )}
    </>
  );
}

function AgentForm({ agent, onClose, onSaved }) {
  const [form, setForm] = useState(agent ? { ...EMPTY, ...agent, rating: String(agent.rating) } : EMPTY);
  const notify = useToast();
  const save = useMutation((body) => (agent ? agentsApi.update(agent.id, body) : agentsApi.create(body)));
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  // ON_DELIVERY is controlled by shipments, so it is never offered here.
  const availabilityOptions = agent?.availability === 'ON_DELIVERY'
    ? ['ON_DELIVERY']
    : ['AVAILABLE', 'OFF_DUTY'];

  const submit = async (e) => {
    e.preventDefault();
    try {
      await save.run({
        name: form.name,
        contactNumber: form.contactNumber,
        vehicleNumber: form.vehicleNumber,
        availability: form.availability,
        rating: form.rating === '' ? null : Number(form.rating),
      });
      notify(agent ? 'Delivery agent updated' : 'Delivery agent created');
      onSaved();
    } catch {
      /* shown inline */
    }
  };

  const errors = save.error?.fieldErrors;
  return (
    <Modal title={agent ? 'Edit delivery agent' : 'New delivery agent'} onClose={onClose}>
      <form className="form" onSubmit={submit}>
        {save.error && !Object.keys(errors).length && <ErrorAlert error={save.error} />}
        <Field label="Name" name="name" errors={errors}>
          <input value={form.name} onChange={set('name')} required maxLength={100} autoFocus />
        </Field>
        <div className="form-row">
          <Field label="Contact number" name="contactNumber" errors={errors}>
            <input value={form.contactNumber} onChange={set('contactNumber')} required />
          </Field>
          <Field label="Vehicle number" name="vehicleNumber" errors={errors} hint="e.g. KA-01-AB-1234">
            <input value={form.vehicleNumber} onChange={set('vehicleNumber')} required />
          </Field>
        </div>
        <div className="form-row">
          <Field label="Availability" name="availability" errors={errors}>
            <Select
              value={form.availability}
              onChange={(v) => setForm({ ...form, availability: v })}
              options={availabilityOptions}
              disabled={agent?.availability === 'ON_DELIVERY'}
            />
          </Field>
          <Field label="Rating (0–5)" name="rating" errors={errors}>
            <input type="number" min="0" max="5" step="0.1" value={form.rating} onChange={set('rating')} />
          </Field>
        </div>
        <div className="form-actions">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={save.pending}>{save.pending ? 'Saving…' : 'Save'}</button>
        </div>
      </form>
    </Modal>
  );
}
