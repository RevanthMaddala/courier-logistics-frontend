import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { shipmentsApi } from '../api/endpoints';
import { useMutation } from '../hooks/useApi';
import { useLookups } from '../hooks/useLookups';
import { useToast } from '../components/Toast';
import PackageFields, { EMPTY_PACKAGE, toPackageBody } from '../components/PackageFields';
import { ErrorAlert, Field, PageHeader, Select } from '../components/ui';
import { todayIso } from '../utils/format';

export default function ShipmentCreatePage() {
  const navigate = useNavigate();
  const notify = useToast();
  const { customers, warehouses, error: lookupError } = useLookups();
  const [form, setForm] = useState({
    customerId: '',
    source: '',
    destination: '',
    weight: '',
    deliveryDate: '',
    warehouseId: '',
  });
  const [packages, setPackages] = useState([{ ...EMPTY_PACKAGE }]);
  const save = useMutation(shipmentsApi.create);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    try {
      const created = await save.run({
        customerId: Number(form.customerId),
        source: form.source,
        destination: form.destination,
        weight: Number(form.weight),
        deliveryDate: form.deliveryDate || null,
        warehouseId: form.warehouseId ? Number(form.warehouseId) : null,
        packages: packages.map(toPackageBody),
      });
      notify(`Shipment booked: ${created.trackingNumber}`);
      navigate(`/shipments/${created.id}`);
    } catch {
      /* shown inline */
    }
  };

  const errors = save.error?.fieldErrors;
  return (
    <>
      <PageHeader
        title="Book a shipment"
        subtitle="A tracking number is generated when you save"
        actions={<Link className="btn" to="/shipments">Cancel</Link>}
      />
      <form className="form" onSubmit={submit}>
        <ErrorAlert error={lookupError} />
        {save.error && <ErrorAlert error={save.error} />}

        <div className="card form">
          <h2>Shipment</h2>
          <Field label="Customer" name="customerId" errors={errors}>
            <Select
              value={form.customerId}
              onChange={(v) => setForm({ ...form, customerId: v })}
              options={customers.map((c) => ({ value: String(c.id), label: `${c.name} (${c.email})` }))}
              placeholder="Select a customer…"
              required
            />
          </Field>
          <div className="form-row">
            <Field label="Source" name="source" errors={errors}>
              <input value={form.source} onChange={set('source')} required maxLength={255} placeholder="e.g. Bengaluru" />
            </Field>
            <Field label="Destination" name="destination" errors={errors}>
              <input value={form.destination} onChange={set('destination')} required maxLength={255} placeholder="e.g. Chennai" />
            </Field>
          </div>
          <div className="form-row">
            <Field label="Weight (kg)" name="weight" errors={errors}>
              <input type="number" min="0.001" step="0.001" value={form.weight} onChange={set('weight')} required />
            </Field>
            <Field label="Expected delivery date" name="deliveryDate" errors={errors}>
              <input type="date" min={todayIso()} value={form.deliveryDate} onChange={set('deliveryDate')} />
            </Field>
            <Field label="Origin warehouse (optional)" name="warehouseId" errors={errors}>
              <Select
                value={form.warehouseId}
                onChange={(v) => setForm({ ...form, warehouseId: v })}
                options={warehouses.map((w) => ({ value: String(w.id), label: w.name }))}
                placeholder="None"
              />
            </Field>
          </div>
        </div>

        <div className="card form">
          <div className="card-header">
            <h2>Packages</h2>
            <button type="button" className="btn btn-small" onClick={() => setPackages([...packages, { ...EMPTY_PACKAGE }])}>
              + Add package
            </button>
          </div>
          {packages.length === 0 && <p className="muted">No packages. You can add them later while the shipment is still Created.</p>}
          {packages.map((pkg, i) => (
            <PackageFields
              key={i}
              value={pkg}
              errors={errors}
              errorPrefix={`packages[${i}].`}
              onChange={(next) => setPackages(packages.map((p, j) => (j === i ? next : p)))}
              onRemove={() => setPackages(packages.filter((_, j) => j !== i))}
            />
          ))}
        </div>

        <div className="form-actions">
          <Link className="btn" to="/shipments">Cancel</Link>
          <button className="btn btn-primary" disabled={save.pending}>{save.pending ? 'Booking…' : 'Book shipment'}</button>
        </div>
      </form>
    </>
  );
}
