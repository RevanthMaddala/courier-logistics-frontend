import { useState } from 'react';
import { Link } from 'react-router-dom';
import { customersApi } from '../api/endpoints';
import { useApi, useMutation } from '../hooks/useApi';
import { useToast } from '../components/Toast';
import { EmptyState, ErrorAlert, Field, Loading, Modal, PageHeader, Pagination } from '../components/ui';
import { formatDateTime } from '../utils/format';

const EMPTY = { name: '', email: '', contactNumber: '', address: '' };

export default function CustomersPage() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null); // null | 'new' | customer
  const notify = useToast();

  const { data, error, loading, reload } = useApi(
    () => customersApi.list({ name: search, page, size: 20, sort: 'id,asc' }),
    [search, page],
  );

  const remove = async (customer) => {
    if (!window.confirm(`Delete customer "${customer.name}"?`)) return;
    try {
      await customersApi.remove(customer.id);
      notify('Customer deleted');
      reload();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  return (
    <>
      <PageHeader
        title="Customers"
        subtitle="People and businesses that book shipments"
        actions={<button className="btn btn-primary" onClick={() => setEditing('new')}>+ New customer</button>}
      />
      <div className="card">
        <div className="filters">
          <input
            placeholder="Search by name…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
          />
        </div>
        <ErrorAlert error={error} onRetry={reload} />
        {loading && !data ? (
          <Loading />
        ) : data?.content.length === 0 ? (
          <EmptyState>No customers found.</EmptyState>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Contact</th>
                  <th>Address</th>
                  <th>Since</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data?.content.map((c) => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>{c.email}</td>
                    <td>{c.contactNumber}</td>
                    <td title={c.address}>{c.address.length > 40 ? `${c.address.slice(0, 40)}…` : c.address}</td>
                    <td className="muted">{formatDateTime(c.createdAt)}</td>
                    <td className="actions">
                      <Link className="btn btn-small" to={`/shipments?customerId=${c.id}`}>Shipments</Link>
                      <button className="btn btn-small" onClick={() => setEditing(c)}>Edit</button>
                      <button className="btn btn-small btn-danger" onClick={() => remove(c)}>Delete</button>
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
        <CustomerForm
          customer={editing === 'new' ? null : editing}
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

function CustomerForm({ customer, onClose, onSaved }) {
  const [form, setForm] = useState(customer ? { ...EMPTY, ...customer } : EMPTY);
  const notify = useToast();
  const save = useMutation((body) => (customer ? customersApi.update(customer.id, body) : customersApi.create(body)));
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    try {
      const { name, email, contactNumber, address } = form;
      await save.run({ name, email, contactNumber, address });
      notify(customer ? 'Customer updated' : 'Customer created');
      onSaved();
    } catch {
      /* shown inline */
    }
  };

  const errors = save.error?.fieldErrors;
  return (
    <Modal title={customer ? 'Edit customer' : 'New customer'} onClose={onClose}>
      <form className="form" onSubmit={submit}>
        {save.error && !Object.keys(errors).length && <ErrorAlert error={save.error} />}
        <Field label="Name" name="name" errors={errors}>
          <input value={form.name} onChange={set('name')} required maxLength={100} autoFocus />
        </Field>
        <Field label="Email" name="email" errors={errors}>
          <input type="email" value={form.email} onChange={set('email')} required maxLength={150} />
        </Field>
        <Field label="Contact number" name="contactNumber" errors={errors} hint="7–15 digits, optional leading +">
          <input value={form.contactNumber} onChange={set('contactNumber')} required />
        </Field>
        <Field label="Address" name="address" errors={errors}>
          <textarea rows={3} value={form.address} onChange={set('address')} required maxLength={500} />
        </Field>
        <div className="form-actions">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={save.pending}>{save.pending ? 'Saving…' : 'Save'}</button>
        </div>
      </form>
    </Modal>
  );
}
