'use client';

import { Mail } from 'lucide-react';
import { fmzCn } from '../../../lib/fmz-classnames';
import type { FmzEmailTemplateMeta } from '../domain/fmz-admin-emails.types';

type Props = {
  templates: FmzEmailTemplateMeta[];
  loading: boolean;
  selected: FmzEmailTemplateMeta | null;
  onSelect: (template: FmzEmailTemplateMeta) => void;
};

const BADGE_STYLES: Record<string, string> = {
  transacional: 'bg-blue-50 text-blue-600',
  marketing:    'bg-purple-50 text-purple-600',
  sistema:      'bg-slate-100 text-fmz-text-muted',
};

const BADGE_LABELS: Record<string, string> = {
  transacional: 'Trans.',
  marketing:    'Mkt.',
  sistema:      'Sis.',
};

export function FmzTemplateSelector({ templates, loading, selected, onSelect }: Props) {
  if (loading) {
    return (
      <div className="flex flex-col gap-2 py-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 animate-pulse rounded-lg bg-fmz-border-light" />
        ))}
      </div>
    );
  }

  if (!templates.length) {
    return (
      <p className="py-6 text-center text-sm text-fmz-text-hint">
        Nenhum template disponível.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1 py-1">
      {templates.map((template) => {
        const isSelected = selected?.id === template.id;
        return (
          <button
            key={template.id}
            type="button"
            onClick={() => onSelect(template)}
            className={fmzCn(
              'flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors',
              isSelected
                ? 'border-fmz-gold bg-[#F5C842]/10 text-fmz-navy'
                : 'border-fmz-border-light bg-fmz-page text-fmz-text-primary hover:border-fmz-border-mid hover:bg-[#E8EAF0]/60',
            )}
          >
            <Mail
              className={fmzCn(
                'h-4 w-4 shrink-0',
                isSelected ? 'text-fmz-gold-dark' : 'text-fmz-text-hint',
              )}
            />
            <span className="min-w-0 flex-1 truncate text-sm font-medium">
              {template.name}
            </span>
            <div className="flex shrink-0 items-center gap-1.5">
              <span className="text-xs text-fmz-text-hint">{template.category}</span>
              <span
                className={fmzCn(
                  'rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                  BADGE_STYLES[template.badge] ?? BADGE_STYLES.sistema,
                )}
              >
                {BADGE_LABELS[template.badge] ?? template.badge}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
