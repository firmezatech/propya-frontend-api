'use client';

import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { fmzCn } from '../../../lib/fmz-classnames';
import { useFmzAdminEmailLogs } from '../hooks/fmz-use-admin-email-logs';
import type { FmzEmailLog } from '../services/fmz-admin-email-api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateBrShort(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: '2-digit',
      hour: '2-digit', minute: '2-digit',
      timeZone: 'America/Sao_Paulo',
    });
  } catch {
    return '—';
  }
}

function originLabel(log: FmzEmailLog): string {
  if (log.emailSource === 'admin') return 'Admin';
  if (log.emailSource === 'job') return log.jobName ? `Job: ${log.jobName}` : 'Job';
  return 'Sistema';
}

// ─── Status chip ──────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  sent:      'bg-fmz-success-bg text-fmz-success border-fmz-success-border',
  delivered: 'bg-fmz-success-bg text-fmz-success border-fmz-success-border',
  opened:    'bg-blue-50 text-blue-600 border-blue-100',
  clicked:   'bg-purple-50 text-purple-600 border-purple-100',
  bounced:   'bg-fmz-error-bg text-fmz-error border-fmz-error-border',
  failed:    'bg-fmz-error-bg text-fmz-error border-fmz-error-border',
  pending:   'bg-fmz-warning-bg text-fmz-warning border-fmz-warning-border',
};

const STATUS_LABELS: Record<string, string> = {
  sent:      'Enviado',
  delivered: 'Entregue',
  opened:    'Aberto',
  clicked:   'Clicou',
  bounced:   'Bounce',
  failed:    'Falhou',
  pending:   'Pendente',
};

function StatusChip({ status }: { status: string }) {
  return (
    <span
      className={fmzCn(
        'inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium',
        STATUS_STYLES[status] ?? 'bg-fmz-page text-fmz-text-muted border-fmz-border-light',
      )}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

// ─── Filter bar ───────────────────────────────────────────────────────────────

type FilterBarProps = {
  filters: ReturnType<typeof useFmzAdminEmailLogs>['filters'];
  onSetFilter: ReturnType<typeof useFmzAdminEmailLogs>['setFilter'];
};

const inputCls =
  'rounded-lg border border-fmz-border-light bg-fmz-page px-3 py-2 text-sm text-fmz-text-primary placeholder-fmz-text-hint outline-none focus:border-fmz-border-mid';

function FilterBar({ filters, onSetFilter }: FilterBarProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <select
        value={filters.status ?? ''}
        onChange={(e) => onSetFilter({ status: e.target.value || undefined })}
        className={inputCls}
      >
        <option value="">Todos os status</option>
        <option value="sent">Enviado</option>
        <option value="delivered">Entregue</option>
        <option value="opened">Aberto</option>
        <option value="clicked">Clicou</option>
        <option value="bounced">Bounce</option>
        <option value="failed">Falhou</option>
        <option value="pending">Pendente</option>
      </select>

      <select
        value={filters.source ?? ''}
        onChange={(e) => onSetFilter({ source: e.target.value || undefined })}
        className={inputCls}
      >
        <option value="">Todas as origens</option>
        <option value="admin">Admin</option>
        <option value="job">Job</option>
        <option value="system">Sistema</option>
      </select>

      <input
        type="text"
        placeholder="Template..."
        value={filters.templateKey ?? ''}
        onChange={(e) => onSetFilter({ templateKey: e.target.value || undefined })}
        className={inputCls}
      />

      <input
        type="date"
        value={filters.dateFrom ?? ''}
        onChange={(e) => onSetFilter({ dateFrom: e.target.value || undefined })}
        className={inputCls}
      />

      <input
        type="date"
        value={filters.dateTo ?? ''}
        onChange={(e) => onSetFilter({ dateTo: e.target.value || undefined })}
        className={inputCls}
      />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function FmzEmailLogsPage() {
  const { logs, total, totalPages, loading, filters, setFilter } = useFmzAdminEmailLogs();

  const currentPage = filters.page ?? 1;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-fmz-text-primary">Histórico de e-mails</h1>
        {!loading && (
          <span className="text-sm text-fmz-text-muted">{total} registros</span>
        )}
      </div>

      <FilterBar filters={filters} onSetFilter={setFilter} />

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-fmz-text-hint" />
        </div>
      ) : logs.length === 0 ? (
        <p className="py-16 text-center text-sm text-fmz-text-hint">
          Nenhum registro encontrado.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-fmz-border-light bg-fmz-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-fmz-border-light bg-fmz-page text-left text-xs font-medium uppercase tracking-wide text-fmz-text-hint">
                <th className="px-4 py-3">Origem</th>
                <th className="px-4 py-3">Template</th>
                <th className="px-4 py-3">Destinatário(s)</th>
                <th className="px-4 py-3">Assunto</th>
                <th className="px-4 py-3">Enviado em</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Aberto</th>
                <th className="px-4 py-3">Clicou</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fmz-border-light">
              {logs.map((log) => (
                <tr key={log.id} className="text-fmz-text-primary hover:bg-fmz-page">
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-fmz-text-muted">
                    {originLabel(log)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-fmz-text-muted">
                    {log.templateKey}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {log.toEmails.length === 1
                      ? (log.toEmails[0] ?? '—')
                      : `${log.toEmails.length} destinatários`}
                  </td>
                  <td className="max-w-[200px] truncate px-4 py-3">
                    {log.subject}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-fmz-text-muted">
                    {formatDateBrShort(log.sentAt ?? log.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusChip status={log.status} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-fmz-text-muted">
                    {formatDateBrShort(log.openedAt)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-fmz-text-muted">
                    {formatDateBrShort(log.clickedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-fmz-text-muted">
            Página {currentPage} de {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFilter({ page: currentPage - 1 })}
              disabled={currentPage <= 1}
              className="flex items-center gap-1 rounded-lg border border-fmz-border-light bg-fmz-page px-3 py-1.5 text-xs text-fmz-text-muted transition-colors hover:bg-fmz-border-light disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Anterior
            </button>
            <button
              type="button"
              onClick={() => setFilter({ page: currentPage + 1 })}
              disabled={currentPage >= totalPages}
              className="flex items-center gap-1 rounded-lg border border-fmz-border-light bg-fmz-page px-3 py-1.5 text-xs text-fmz-text-muted transition-colors hover:bg-fmz-border-light disabled:opacity-40"
            >
              Próxima
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
