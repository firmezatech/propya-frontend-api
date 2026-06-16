'use client';

import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { fmzCn } from '../../../lib/fmz-classnames';
import { useFmzAdminInvites } from '../hooks/fmz-use-admin-invites';
import type { FmzTenantInvite } from '../services/fmz-admin-email-api';

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

function propertySummary(invite: FmzTenantInvite): string {
  const { property, address } = invite.propertySnapshot;
  return [property, address].filter(Boolean).join(' · ') || '—';
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<FmzTenantInvite['status'], string> = {
  pending:  'bg-fmz-warning-bg text-fmz-warning border-fmz-warning-border',
  accepted: 'bg-fmz-success-bg text-fmz-success border-fmz-success-border',
  expired:  'bg-fmz-error-bg text-fmz-error border-fmz-error-border',
};

const STATUS_LABELS: Record<FmzTenantInvite['status'], string> = {
  pending:  'Pendente',
  accepted: 'Aceito',
  expired:  'Expirado',
};

function StatusBadge({ status }: { status: FmzTenantInvite['status'] }) {
  return (
    <span className={fmzCn('inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium', STATUS_STYLES[status])}>
      {STATUS_LABELS[status]}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function FmzInvitesHistoryPage() {
  const { invites, total, totalPages, loading, filters, setFilter } = useFmzAdminInvites();

  const currentPage = filters.page ?? 1;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-fmz-text-primary">Convites de locação</h1>
        {!loading && (
          <span className="text-sm text-fmz-text-muted">{total} registros</span>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-fmz-text-hint" />
        </div>
      ) : invites.length === 0 ? (
        <p className="py-16 text-center text-sm text-fmz-text-hint">
          Nenhum convite enviado ainda.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-fmz-border-light bg-fmz-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-fmz-border-light bg-fmz-page text-left text-xs font-medium uppercase tracking-wide text-fmz-text-hint">
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3">Imóvel</th>
                <th className="px-4 py-3">Criado em</th>
                <th className="px-4 py-3">Expira em</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fmz-border-light">
              {invites.map((invite) => (
                <tr key={invite.id} className="text-fmz-text-primary hover:bg-fmz-page">
                  <td className="px-4 py-3 text-xs">{invite.invitedEmail}</td>
                  <td className="max-w-[240px] truncate px-4 py-3 text-xs text-fmz-text-muted">
                    {propertySummary(invite)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-fmz-text-muted">
                    {formatDateBrShort(invite.createdAt)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-fmz-text-muted">
                    {formatDateBrShort(invite.expiresAt)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={invite.status} />
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
