import { useState } from 'react';
import { Link } from 'react-router-dom';
import { warehousesApi } from '../api/endpoints';
import { useApi, useMutation } from '../hooks/useApi';
import { useToast } from '../components/Toast';
import { EmptyState, ErrorAlert, Field, Loading, Modal, PageHeader, Pagination } from '../components/ui';

const EMPTY = { name: '', location: '', capacity: '', contactNumber: '' };

export default function WarehousesPage() {
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState(null);
  const notify = useToast();

  const { data, error, loading, reload } = useApi(
    () => warehousesApi.list({ page, size: 20, sort: 'id,asc' }),
    [page],
  );

  const remove = async (warehouse) => {
    if (!window.confirm(`Delete warehouse "${warehouse.name}"?`)) return;
    try {
      await warehousesApi.remove(warehouse.id);
      notify('Warehouse deleted');
      reload();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  return (
    <>
      <PageHeader
        title="Warehouses"
        subtitle="Hubs where shipments are sorted and stored"
        actions={<button className="btn btn-primary" onClick={() => setEditing('new')}>+ New warehouse</button>}
      />
      <div className="card">
        <ErrorAlert error={error} onRetry={reload} />
        {loading && !data ? (
          <Loading />
        ) : data?.content.length === 0 ? (
          <EmptyState>No warehouses yet.</EmptyState>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Location</th>
                  <th>Capacity</th>
                  <th>Contact</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data?.content.map((w) => (
                  <tr key={w.id}>
                    <td>{w.name}</td>
                    <td>{w.location}</td>
                    <td>{w.capacity.toLocaleString()}</td>
                    <td>{w.contactNumber}</td>
                    <td className="actions">
                      <Link className="btn btn-small" to={`/shipments?warehouseId=${w.id}`}>Shipments</Link>
                      <button className="btn btn-small" onClick={() => setEditing(w)}>Edit</button>
                      <button className="btn btn-small btn-danger" onClick={() => remove(w)}>Delete</button>
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
        <WarehouseForm
          warehouse={editing === 'new' ? null : editing}
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

function WarehouseForm({ warehouse, onClose, onSaved }) {
  const [form, setForm] = useState(warehouse ? { ...EMPTY, ...warehouse } : EMPTY);
  const notify = useToast();
  const save = useMutation((body) =>
    warehouse ? warehousesApi.update(warehouse.id, body) : warehousesApi.create(body),
  );
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    try {
      await save.run({
        name: form.name,
        location: form.location,
        capacity: Number(form.capacity),
        contactNumber: form.contactNumber,
      });
      notify(warehouse ? 'Warehouse updated' : 'Warehouse created');
      onSaved();
    } catch {
      /* shown inline */
    }
  };

  const errors = save.error?.fieldErrors;
  return (
    <Modal title={warehouse ? 'Edit warehouse' : 'New warehouse'} onClose={onClose}>
      <form className="form" onSubmit={submit}>
        {save.error && !Object.keys(errors).length && <ErrorAlert error={save.error} />}
        <Field label="Name" name="name" errors={errors}>
          <input value={form.name} onChange={set('name')} required maxLength={100} autoFocus />
        </Field>
        <Field label="Location" name="location" errors={errors}>
          <input value={form.location} onChange={set('location')} required maxLength={255} />
        </Field>
        <div className="form-row">
          <Field label="Capacity" name="capacity" errors={errors} hint="Max active shipments">
            <input type="number" min="1" value={form.capacity} onChange={set('capacity')} required />
          </Field>
          <Field label="Contact number" name="contactNumber" errors={errors}>
            <input value={form.contactNumber} onChange={set('contactNumber')} required />
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
