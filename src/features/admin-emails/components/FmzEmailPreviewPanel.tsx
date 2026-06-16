'use client';

import { useState } from 'react';
import { Check, Copy, Loader2, Monitor, Smartphone } from 'lucide-react';
import { fmzCn } from '../../../lib/fmz-classnames';
import type { FmzAdminEmailRecipient, FmzEmailTemplateMeta } from '../domain/fmz-admin-emails.types';

type Props = {
  html: string;
  loading: boolean;
  selectedTemplate: FmzEmailTemplateMeta | null;
  recipients: FmzAdminEmailRecipient[];
  subject: string;
};

type ViewMode = 'desktop' | 'mobile';

const MAX_RECIPIENTS_SHOWN = 2;

function recipientsSummary(recipients: FmzAdminEmailRecipient[]): string {
  if (!recipients.length) return '—';
  const names = recipients
    .slice(0, MAX_RECIPIENTS_SHOWN)
    .map((r) => r.name || r.email);
  const extra = recipients.length - MAX_RECIPIENTS_SHOWN;
  return extra > 0 ? `${names.join(', ')} +${extra}` : names.join(', ');
}

export function FmzEmailPreviewPanel({ html, loading, selectedTemplate, recipients, subject }: Props) {
  const [viewMode, setViewMode]   = useState<ViewMode>('desktop');
  const [copied, setCopied]       = useState(false);

  const copyHtml = async () => {
    if (!html) return;
    try {
      await navigator.clipboard.writeText(html);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — silent fail
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* Panel header */}
      <div className="flex shrink-0 items-center justify-between border-b border-fmz-border-light px-4 py-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-fmz-text-hint">
          Pré-visualização
        </span>

        <div className="flex items-center gap-2">
          {/* Desktop / Mobile toggle */}
          <div className="flex rounded-lg border border-fmz-border-light bg-fmz-page p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('desktop')}
              aria-label="Visualização desktop"
              className={fmzCn(
                'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                viewMode === 'desktop'
                  ? 'bg-fmz-card text-fmz-navy shadow-sm border border-fmz-border-light'
                  : 'text-fmz-text-muted hover:text-fmz-text-primary',
              )}
            >
              <Monitor className="h-3.5 w-3.5" />
              Desktop
            </button>
            <button
              type="button"
              onClick={() => setViewMode('mobile')}
              aria-label="Visualização mobile"
              className={fmzCn(
                'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                viewMode === 'mobile'
                  ? 'bg-fmz-card text-fmz-navy shadow-sm border border-fmz-border-light'
                  : 'text-fmz-text-muted hover:text-fmz-text-primary',
              )}
            >
              <Smartphone className="h-3.5 w-3.5" />
              Mobile
            </button>
          </div>

          {/* Copy HTML */}
          <button
            type="button"
            onClick={copyHtml}
            disabled={!html}
            aria-label="Copiar HTML"
            className="flex items-center gap-1.5 rounded-lg border border-fmz-border-light bg-fmz-page px-3 py-1.5 text-xs font-medium text-fmz-text-muted transition-colors hover:bg-fmz-border-light disabled:opacity-40"
          >
            {copied
              ? <><Check className="h-3.5 w-3.5 text-fmz-success" />Copiado</>
              : <><Copy className="h-3.5 w-3.5" />Copiar HTML</>
            }
          </button>
        </div>
      </div>

      {/* Metadata bar */}
      {selectedTemplate && (
        <div className="shrink-0 border-b border-fmz-border-light bg-fmz-page px-4 py-2.5">
          <dl className="flex flex-col gap-0.5 text-xs">
            <div className="flex gap-2">
              <dt className="w-14 shrink-0 font-medium text-fmz-text-hint">De</dt>
              <dd className="text-fmz-text-muted">noreply@mail.propya.com.br</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-14 shrink-0 font-medium text-fmz-text-hint">Para</dt>
              <dd className="truncate text-fmz-text-muted">{recipientsSummary(recipients)}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-14 shrink-0 font-medium text-fmz-text-hint">Assunto</dt>
              <dd className="truncate text-fmz-text-muted">{subject || '—'}</dd>
            </div>
          </dl>
        </div>
      )}

      {/* Preview body */}
      <div className="min-h-0 flex-1 overflow-y-auto bg-fmz-page">
        {loading ? (
          <div className="flex h-full min-h-[240px] flex-col items-center justify-center gap-3 text-fmz-text-hint">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-sm">Gerando pré-visualização…</span>
          </div>
        ) : !html ? (
          <div className="flex h-full min-h-[240px] flex-col items-center justify-center gap-3 text-fmz-text-hint">
            <Monitor className="h-10 w-10 opacity-30" />
            <span className="text-sm">Preencha os campos para ver a pré-visualização.</span>
          </div>
        ) : (
          <div className="flex justify-center py-6 px-4">
            <div
              style={{ width: viewMode === 'desktop' ? '680px' : '375px' }}
              className="overflow-hidden rounded-lg border border-fmz-border-light bg-white shadow-sm transition-[width] duration-200"
            >
              {/* HTML comes from our own template files rendered server-side — not from user input */}
              <iframe
                srcDoc={html}
                title="Pré-visualização do e-mail"
                className="block h-[600px] w-full"
                sandbox="allow-same-origin"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
