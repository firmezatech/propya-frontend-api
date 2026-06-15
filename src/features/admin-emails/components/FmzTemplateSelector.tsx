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
  transacional: 'bg-blue-500/15 text-blue-300',
  marketing:    'bg-purple-500/15 text-purple-300',
  sistema:      'bg-slate-500/15 text-slate-300',
};

export function FmzTemplateSelector({ templates, loading, selected, onSelect }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-white/5" />
        ))}
      </div>
    );
  }

  if (!templates.length) {
    return (
      <p className="py-4 text-center text-sm text-fmz-neutral-400">
        Nenhum template disponível.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {templates.map((template) => {
        const isSelected = selected?.id === template.id;
        return (
          <button
            key={template.id}
            type="button"
            onClick={() => onSelect(template)}
            className={fmzCn(
              'flex flex-col gap-1 rounded-xl border p-4 text-left transition-colors',
              isSelected
                ? 'border-fmz-teal bg-fmz-teal/10 text-fmz-teal'
                : 'border-white/10 bg-white/5 text-fmz-neutral-200 hover:border-white/20 hover:bg-white/10',
            )}
          >
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0" />
              <span className="text-sm font-medium leading-tight">{template.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-fmz-neutral-400">{template.category}</span>
              <span
                className={fmzCn(
                  'rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide',
                  BADGE_STYLES[template.badge] ?? BADGE_STYLES.sistema,
                )}
              >
                {template.badge}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
