import { PACKAGE_TYPES } from '../constants';
import { Field, Select } from './ui';

export const EMPTY_PACKAGE = { packageType: 'BOX', fragile: false, lengthCm: '', widthCm: '', heightCm: '' };

export function toPackageBody(pkg) {
  return {
    packageType: pkg.packageType,
    fragile: pkg.fragile,
    lengthCm: Number(pkg.lengthCm),
    widthCm: Number(pkg.widthCm),
    heightCm: Number(pkg.heightCm),
  };
}

/** One editable package: type, fragile flag and dimensions in cm. */
export default function PackageFields({ value, onChange, onRemove, errors, errorPrefix = '' }) {
  const set = (key) => (e) => onChange({ ...value, [key]: e.target.value });
  return (
    <div className="package-row">
      <Field label="Type" name={`${errorPrefix}packageType`} errors={errors}>
        <Select value={value.packageType} onChange={(v) => onChange({ ...value, packageType: v })} options={PACKAGE_TYPES} />
      </Field>
      {['lengthCm', 'widthCm', 'heightCm'].map((dim) => (
        <Field key={dim} label={`${dim.replace('Cm', '')} (cm)`} name={`${errorPrefix}${dim}`} errors={errors}>
          <input type="number" min="0.01" step="0.01" value={value[dim]} onChange={set(dim)} required />
        </Field>
      ))}
      <label className="checkbox">
        <input
          type="checkbox"
          checked={value.fragile}
          onChange={(e) => onChange({ ...value, fragile: e.target.checked })}
        />
        Fragile
      </label>
      {onRemove ? (
        <button type="button" className="btn btn-small btn-danger" onClick={onRemove}>Remove</button>
      ) : (
        <span />
      )}
    </div>
  );
}
