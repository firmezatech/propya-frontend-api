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

// ─── Sub-components ───────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  sent:      'bg-emerald-500/15 text-emerald-300',
  delivered: 'bg-emerald-500/15 text-emerald-300',
  opened:    'bg-blue-500/15 text-blue-300',
  clicked:   'bg-purple-500/15 text-purple-300',
  bounced:   'bg-red-500/15 text-red-300',
  failed:    'bg-red-500/15 text-red-300',
  pending:   'bg-yellow-500/15 text-yellow-300',
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
        'inline-block rounded-full px-2.5 py-0.5 text-xs font-medium',
        STATUS_STYLES[status] ?? 'bg-slate-500/15 text-slate-300',
      )}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

// ─── Filters bar ──────────────────────────────────────────────────────────────

type FilterBarProps = {
  filters: ReturnType<typeof useFmzAdminEmailLogs>['filters'];
  onSetFilter: ReturnType<typeof useFmzAdminEmailLogs>['setFilter'];
};

function FilterBar({ filters, onSetFilter }: FilterBarProps) {
  const inputCls = 'rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-fmz-neutral-100 placeholder-fmz-neutral-500 outline-none focus:border-fmz-teal/50 focus:ring-1 focus:ring-fmz-teal/30';

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
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-fmz-neutral-100">Histórico de e-mails</h1>
        {!loading && (
          <span className="text-sm text-fmz-neutral-400">{total} registros</span>
        )}
      </div>

      <FilterBar filters={filters} onSetFilter={setFilter} />

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-fmz-neutral-400" />
        </div>
      ) : logs.length === 0 ? (
        <p className="py-16 text-center text-sm text-fmz-neutral-400">
          Nenhum registro encontrado.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-left text-xs font-medium uppercase tracking-wide text-fmz-neutral-400">
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
            <tbody className="divide-y divide-white/5">
              {logs.map((log) => (
                <tr key={log.id} className="text-fmz-neutral-200 hover:bg-white/5">
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-fmz-neutral-400">
                    {originLabel(log)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">
                    {log.templateKey}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {log.toEmails.length === 1
                      ? log.toEmails[0]
                      : `${log.toEmails.length} destinatários`}
                  </td>
                  <td className="max-w-[200px] truncate px-4 py-3">
                    {log.subject}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-fmz-neutral-400">
                    {formatDateBrShort(log.sentAt ?? log.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusChip status={log.status} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-fmz-neutral-400">
                    {formatDateBrShort(log.openedAt)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-fmz-neutral-400">
                    {formatDateBrShort(log.clickedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-fmz-neutral-400">
            Página {currentPage} de {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFilter({ page: currentPage - 1 })}
              disabled={currentPage <= 1}
              className="flex items-center gap-1 rounded-xl border border-white/10 px-3 py-1.5 text-xs text-fmz-neutral-300 transition-colors hover:bg-white/5 disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Anterior
            </button>
            <button
              type="button"
              onClick={() => setFilter({ page: currentPage + 1 })}
              disabled={currentPage >= totalPages}
              className="flex items-center gap-1 rounded-xl border border-white/10 px-3 py-1.5 text-xs text-fmz-neutral-300 transition-colors hover:bg-white/5 disabled:opacity-40"
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
