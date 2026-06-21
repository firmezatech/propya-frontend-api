'use client';

import { useCallback, useMemo, useState } from 'react';
import { CheckCheck, Loader2 } from 'lucide-react';
import { useFmzAdminCoOwnerPayouts } from '../hooks/fmz-admin-co-owner-payouts';
import { FmzSelect } from '../../../components/design-system';
import { FmzAdminCoOwnerPayoutsSummary } from './FmzAdminCoOwnerPayoutsSummary';
import { FmzAdminCoOwnerPayoutTransactionCard } from './FmzAdminCoOwnerPayoutTransactionCard';
import { FmzAdminCoOwnerPayoutConfirmModal } from './FmzAdminCoOwnerPayoutConfirmModal';
import { FmzFormAlert } from '../../api-errors/components';
import { FmzAdminListSkeleton } from '../../../components/layout';
import type { FmzCoOwnerPayoutRow, FmzPayoutRequestStatus } from '../domain';

// ─── Filter options ─────────────────────────────────────────────────────────────

function buildCompetenceMonthOptions(): Array<{ value: string; label: string }> {
  const options: Array<{ value: string; label: string }> = [];
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  for (let offset = 0; offset <= 5; offset++) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const value = `${year}-${month}-01`;
    const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    options.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
  }
  return options;
}

const COMPETENCE_MONTH_OPTIONS = buildCompetenceMonthOptions();

const STATUS_OPTIONS: Array<{ value: FmzPayoutRequestStatus | ''; label: string }> = [
  { value: '', label: 'Todos' },
  { value: 'pending_approval', label: 'Aguardando aprovação' },
  { value: 'approved', label: 'Em processamento' },
  { value: 'paid', label: 'Pago' },
  { value: 'rejected', label: 'Rejeitado' },
];

const TOAST_DURATION_MS = 2800;

const brlFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function parseBrl(value: string): number {
  const normalized = value.includes(',') ? value.replace(/\./g, '').replace(',', '.') : value;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FmzAdminCoOwnerPayoutsList() {
  const hook = useFmzAdminCoOwnerPayouts();

  const [pendingApprove, setPendingApprove] = useState<FmzCoOwnerPayoutRow | null>(null);
  const [pendingReject, setPendingReject] = useState<FmzCoOwnerPayoutRow | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [pendingBatch, setPendingBatch] = useState(false);
  const [toast, setToast] = useState<{ message: string; ok: boolean } | null>(null);

  const notify = useCallback((message: string, ok: boolean) => {
    setToast({ message, ok });
    window.setTimeout(() => setToast(null), TOAST_DURATION_MS);
  }, []);

  // ── Approve (D-4) ────────────────────────────────────────────────────────────

  const handleConfirmApprove = useCallback(async () => {
    if (!pendingApprove?.payoutRequest) return;
    const ok = await hook.approve(pendingApprove.payoutRequest.id);
    setPendingApprove(null);
    notify(ok ? 'Pagamento aprovado e PIX enviado.' : 'Falha ao aprovar o pagamento.', ok);
  }, [pendingApprove, hook, notify]);

  // ── Reject (D-4) ─────────────────────────────────────────────────────────────

  const handleConfirmReject = useCallback(async () => {
    if (!pendingReject?.payoutRequest) return;
    const ok = await hook.reject(pendingReject.payoutRequest.id, rejectReason.trim() || undefined);
    setPendingReject(null);
    setRejectReason('');
    notify(ok ? 'Pedido de pagamento rejeitado.' : 'Falha ao rejeitar o pedido.', ok);
  }, [pendingReject, rejectReason, hook, notify]);

  // ── Approve batch (D-5) ──────────────────────────────────────────────────────

  const selectedCount = hook.selectedRequestIds.size;
  const selectedTotalBrl = useMemo(() => {
    const total = hook.rows
      .filter((row) => row.payoutRequest && hook.selectedRequestIds.has(row.payoutRequest.id))
      .reduce((sum, row) => sum + parseBrl(row.accruedBalanceBrl), 0);
    return brlFormatter.format(total);
  }, [hook.rows, hook.selectedRequestIds]);

  const handleConfirmBatch = useCallback(async () => {
    const results = await hook.approveSelected();
    setPendingBatch(false);
    if (!results) {
      notify('Falha ao aprovar os pagamentos selecionados.', false);
      return;
    }
    const failed = results.filter((r) => r.status !== 'paid');
    if (failed.length === 0) {
      notify(`${results.length} pagamento(s) aprovado(s) com sucesso.`, true);
    } else {
      notify(`${results.length - failed.length} aprovado(s), ${failed.length} falhou(aram). Veja a lista atualizada.`, false);
    }
  }, [hook, notify]);

  return (
    <div className="relative pb-10">
      {toast && (
        <div
          className={`fixed right-5 top-5 z-[400] rounded-[10px] px-4 py-2.5 text-[13px] font-semibold text-white shadow-lg ${
            toast.ok ? 'bg-[#1A8C5B]' : 'bg-[#D94F3D]'
          }`}
        >
          {toast.message}
        </div>
      )}

      <h1 className="mb-1 text-[22px] font-bold text-fmz-navy">Pagamentos a co-owners</h1>
      <p className="mb-6 text-[13px] text-fmz-text-muted">
        Aluguel e venda de tokens — aprove ou rejeite os pedidos de PIX gerados pelo job mensal.
      </p>

      <FmzFormAlert error={hook.listError ?? hook.approveError ?? hook.rejectError ?? hook.batchApproveError} />

      <FmzAdminCoOwnerPayoutsSummary summary={hook.summary} />

      <div className="mb-5 flex flex-wrap items-center gap-2.5">
        <FmzSelect
          value={hook.filters.competenceMonth}
          onChange={(e) => hook.setFilter({ competenceMonth: e.target.value })}
          wrapperClassName="h-auto rounded-[9px] border-[1.5px] border-[#E8EAF0] bg-white py-2.5 pl-3.5 focus-within:border-[#F5C842]"
          className="text-[13px] font-medium text-[#0D1321]"
        >
          {COMPETENCE_MONTH_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </FmzSelect>

        <FmzSelect
          value={hook.filters.status ?? ''}
          onChange={(e) => hook.setFilter({ status: (e.target.value || undefined) as FmzPayoutRequestStatus | undefined })}
          wrapperClassName="h-auto rounded-[9px] border-[1.5px] border-[#E8EAF0] bg-white py-2.5 pl-3.5 focus-within:border-[#F5C842]"
          className="text-[13px] text-[#5A6478]"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </FmzSelect>

        {hook.listLoading && <Loader2 size={16} className="animate-spin text-[#9AA3B0]" />}
      </div>

      {hook.listLoading ? (
        <FmzAdminListSkeleton rows={5} />
      ) : hook.transactions.length === 0 ? (
        <div className="rounded-2xl border border-fmz-border-light bg-white p-8 text-center text-[13.5px] text-fmz-text-muted">
          Nenhum evento de pagamento neste mês de competência.
        </div>
      ) : (
        <div className="space-y-4">
          {hook.transactions.map((transaction) => (
            <FmzAdminCoOwnerPayoutTransactionCard
              key={`${transaction.sourceType}:${transaction.sourceReferenceId}`}
              transaction={transaction}
              selectedRequestIds={hook.selectedRequestIds}
              onToggleSelect={hook.toggleSelected}
              onApproveClick={setPendingApprove}
              onRejectClick={setPendingReject}
            />
          ))}
        </div>
      )}

      {selectedCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-[290] flex items-center justify-center gap-4 border-t border-fmz-border-light bg-white px-6 py-3.5 shadow-[0_-8px_24px_-8px_rgba(14,22,38,0.12)]">
          <span className="text-[13px] font-medium text-fmz-navy">
            {selectedCount} selecionado{selectedCount === 1 ? '' : 's'} · {selectedTotalBrl}
          </span>
          <button
            type="button"
            onClick={hook.clearSelection}
            className="text-[13px] font-semibold text-fmz-text-muted hover:text-fmz-navy"
          >
            Limpar
          </button>
          <button
            type="button"
            onClick={() => setPendingBatch(true)}
            className="inline-flex items-center gap-1.5 rounded-[10px] bg-[#1A8C5B] px-4 py-2 text-[13px] font-semibold text-white transition-all hover:bg-[#157048]"
          >
            <CheckCheck size={14} /> Aprovar selecionados
          </button>
        </div>
      )}

      <FmzAdminCoOwnerPayoutConfirmModal
        isOpen={pendingApprove !== null}
        variant="approve"
        busy={hook.approving}
        title="Aprovar pagamento?"
        description={`Isto envia um PIX real via Asaas para ${pendingApprove?.ownerName ?? 'este co-owner'} no valor de ${pendingApprove ? brlFormatter.format(parseBrl(pendingApprove.accruedBalanceBrl)) : ''}.`}
        confirmLabel="Aprovar e pagar"
        onConfirm={handleConfirmApprove}
        onCancel={() => setPendingApprove(null)}
      />

      <FmzAdminCoOwnerPayoutConfirmModal
        isOpen={pendingReject !== null}
        variant="reject"
        busy={hook.rejecting}
        title="Rejeitar pedido de pagamento?"
        description={`O saldo de ${pendingReject?.ownerName ?? 'este co-owner'} continua acumulando e será incluído no próximo ciclo do job.`}
        confirmLabel="Rejeitar"
        reason={rejectReason}
        onReasonChange={setRejectReason}
        onConfirm={handleConfirmReject}
        onCancel={() => { setPendingReject(null); setRejectReason(''); }}
      />

      <FmzAdminCoOwnerPayoutConfirmModal
        isOpen={pendingBatch}
        variant="batch"
        busy={hook.batchApproving}
        title={`Aprovar ${selectedCount} pagamento(s)?`}
        description={`Isto envia ${selectedCount} PIX real(is) via Asaas, totalizando ${selectedTotalBrl}.`}
        confirmLabel="Aprovar todos"
        onConfirm={handleConfirmBatch}
        onCancel={() => setPendingBatch(false)}
      />
    </div>
  );
}
