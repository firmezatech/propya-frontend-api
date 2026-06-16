'use client';

import { useEffect, useState } from 'react';
import type { FmzEmailTemplateMeta } from '../domain/fmz-admin-emails.types';
import { getAdminProperties } from '../../admin-properties/services/fmz-admin-properties-api';
import type { FmzAdminProperty } from '../../admin-properties/domain';

type Props = {
  template: FmzEmailTemplateMeta;
  vars: Record<string, string>;
  previewLoading: boolean;
  onVarChange: (fieldId: string, value: string) => void;
};

const inputCls =
  'w-full rounded-lg border border-fmz-border-light bg-fmz-page px-3 py-2 text-sm text-fmz-text-primary placeholder-fmz-text-hint outline-none focus:border-fmz-border-mid focus:ring-1 focus:ring-[#0D1321]/10';

const composePropertyAddress = (property: FmzAdminProperty): string =>
  [
    [property.addressLine1, property.addressNumber].filter(Boolean).join(' '),
    property.addressLine2,
    property.district,
    property.city && property.state ? `${property.city} — ${property.state}` : property.city || property.state,
  ].filter(Boolean).join(', ');

// Registered-property picker for the `property` field type (e.g. the `invite` template):
// the admin selects from property_mgmt.properties instead of typing name/address freely.
// Loads up to 200 properties once on mount — a plain <select>, not a search-as-you-type
// combobox, since the inventory is small enough that a single fetch suffices for now.
function FmzPropertySelectField({
  value,
  onSelect,
}: {
  value: string;
  onSelect: (id: string, name: string, address: string) => void;
}) {
  const [properties, setProperties] = useState<FmzAdminProperty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getAdminProperties({ limit: 200 })
      .then((result) => { if (!cancelled) setProperties(result.items); })
      .catch(() => { if (!cancelled) setProperties([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <select
      value={value}
      onChange={(e) => {
        const property = properties.find((p) => p.id === e.target.value);
        if (property) onSelect(property.id, property.name, composePropertyAddress(property));
      }}
      disabled={loading}
      className={inputCls}
    >
      <option value="">{loading ? 'Carregando imóveis…' : 'Selecione um imóvel'}</option>
      {properties.map((property) => (
        <option key={property.id} value={property.id}>
          {property.name} — {composePropertyAddress(property)}
        </option>
      ))}
    </select>
  );
}

export function FmzFieldsCustomizer({ template, vars, previewLoading, onVarChange }: Props) {
  if (!template.fields.length) {
    return (
      <p className="py-4 text-center text-sm text-fmz-text-hint">
        Este template não possui campos personalizáveis.
        {previewLoading && ' Gerando pré-visualização…'}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3 py-1">
      {template.fields.map((field) => (
        <div key={field.id} className="flex flex-col gap-1">
          <label className="text-xs font-medium text-fmz-text-muted">
            {field.label}
            {field.required && <span className="ml-1 text-fmz-error">*</span>}
          </label>
          {field.type === 'property' ? (
            <FmzPropertySelectField
              value={vars[field.id] ?? ''}
              onSelect={(id, name, address) => {
                onVarChange(field.id, id);
                onVarChange('property', name);
                onVarChange('address', address);
              }}
            />
          ) : (
            <input
              type={field.type === 'url' ? 'url' : field.type === 'date' ? 'date' : 'text'}
              value={vars[field.id] ?? ''}
              onChange={(e) => onVarChange(field.id, e.target.value)}
              placeholder={field.placeholder || field.label}
              className={inputCls}
            />
          )}
        </div>
      ))}

      {previewLoading && (
        <p className="text-right text-xs text-fmz-text-hint">Atualizando pré-visualização…</p>
      )}
    </div>
  );
}
