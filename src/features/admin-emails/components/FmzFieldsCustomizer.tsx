'use client';

import type { FmzEmailTemplateMeta } from '../domain/fmz-admin-emails.types';

type Props = {
  template: FmzEmailTemplateMeta;
  vars: Record<string, string>;
  previewLoading: boolean;
  onVarChange: (fieldId: string, value: string) => void;
};

const inputCls =
  'w-full rounded-lg border border-fmz-border-light bg-fmz-page px-3 py-2 text-sm text-fmz-text-primary placeholder-fmz-text-hint outline-none focus:border-fmz-border-mid focus:ring-1 focus:ring-[#0D1321]/10';

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
          <input
            type={field.type === 'url' ? 'url' : 'text'}
            value={vars[field.id] ?? ''}
            onChange={(e) => onVarChange(field.id, e.target.value)}
            placeholder={field.placeholder || field.label}
            className={inputCls}
          />
        </div>
      ))}

      {previewLoading && (
        <p className="text-right text-xs text-fmz-text-hint">Atualizando pré-visualização…</p>
      )}
    </div>
  );
}
