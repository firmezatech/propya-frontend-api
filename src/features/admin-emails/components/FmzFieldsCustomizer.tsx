'use client';

import { RefreshCw } from 'lucide-react';
import type { FmzEmailTemplateMeta } from '../domain/fmz-admin-emails.types';

type Props = {
  template: FmzEmailTemplateMeta;
  subject: string;
  vars: Record<string, string>;
  previewLoading: boolean;
  onSubjectChange: (value: string) => void;
  onVarChange: (fieldId: string, value: string) => void;
  onRefreshPreview: () => void;
};

export function FmzFieldsCustomizer({
  template,
  subject,
  vars,
  previewLoading,
  onSubjectChange,
  onVarChange,
  onRefreshPreview,
}: Props) {
  return (
    <div className="flex flex-col gap-4">
      {/* Subject */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-fmz-neutral-300">
          Assunto do e-mail
        </label>
        <input
          type="text"
          value={subject}
          onChange={(e) => onSubjectChange(e.target.value)}
          placeholder="Assunto..."
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-fmz-neutral-100 placeholder-fmz-neutral-500 outline-none focus:border-fmz-teal/50 focus:ring-1 focus:ring-fmz-teal/30"
        />
      </div>

      {/* Template fields */}
      {template.fields.map((field) => (
        <div key={field.id} className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-fmz-neutral-300">
            {field.label}
            {field.required && <span className="ml-1 text-red-400">*</span>}
          </label>
          <input
            type={field.type === 'url' ? 'url' : 'text'}
            value={vars[field.id] ?? ''}
            onChange={(e) => onVarChange(field.id, e.target.value)}
            placeholder={field.placeholder || field.label}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-fmz-neutral-100 placeholder-fmz-neutral-500 outline-none focus:border-fmz-teal/50 focus:ring-1 focus:ring-fmz-teal/30"
          />
        </div>
      ))}

      {/* Preview trigger */}
      <button
        type="button"
        onClick={onRefreshPreview}
        disabled={previewLoading}
        className="flex items-center justify-center gap-2 rounded-xl border border-fmz-teal/40 py-2.5 text-sm font-medium text-fmz-teal transition-colors hover:bg-fmz-teal/10 disabled:opacity-50"
      >
        <RefreshCw className={`h-4 w-4 ${previewLoading ? 'animate-spin' : ''}`} />
        {previewLoading ? 'Gerando...' : 'Gerar pré-visualização'}
      </button>
    </div>
  );
}
