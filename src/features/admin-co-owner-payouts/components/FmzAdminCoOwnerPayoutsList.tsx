'use client';

import { useCallback, useMemo, useState } from 'react';
import { CheckCheck, Loader2, Send } from 'lucide-react';
import { useFmzAdminCoOwnerPayouts } from '../hooks/fmz-admin-co-owner-payouts';
import { FmzSelect } from '../../../components/design-system';
import { FmzAdminCoOwnerPayoutsSummary } from './FmzAdminCoOwnerPayoutsSummary';
import { FmzAdminCoOwnerPayoutTransactionCard } from './FmzAdminCoOwnerPayoutTransactionCard';
import { FmzAdminCoOwnerPayoutConfirmModal } from './FmzAdminCoOwnerPayoutConfirmModal';
import { FmzFormAlert } from '../../api-errors/components';
import { FmzAdminListSkeleton } from '../../../components/layout';
import { deriveRowState } from '../domain/fmz-admin-co-owner-payouts-row-state';
import type { FmzCoOwnerPayoutRow, FmzCoOwnerPayoutTransaction, FmzPayoutRequestStatus } from '../domain';

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
  { value: '', label: 'Todos os status' },
  { value: 'pending_approval', label: 'Aguardando aprovação' },
  { value: 'approved', label: 'Em processamento' },
  { value: 'paid', label: 'Pago' },
  { value: 'rejected', label: 'Rejeitado' },
];

// D-13: filtro de tipo é 100% client-side — sourceType já vem em toda linha, sem parâmetro de API.
type FmzAdminCoOwnerPayoutsTypeFilter = '' | FmzCoOwnerPayoutTransaction['sourceType'];

const TYPE_OPTIONS: Array<{ value: FmzAdminCoOwnerPayoutsTypeFilter; label: string }> = [
  { value: '', label: 'Todos os tipos' },
  { value: 'rent_distribution', label: 'Ciclo Mensal' },
  { value: 'token_sale', label: 'Compra Avulsa' },
];

const FILTER_SELECT_WRAPPER_CLASS = 'h-auto rounded-[8px] border-[1.5px] border-[#E8EAF0] bg-white px-2.5 py-[6px] focus-within:border-fmz-navy';
const FILTER_SELECT_TEXT_CLASS = 'text-[12.5px] font-medium text-fmz-navy';

const TOAST_DURATION_MS = 2800;

const brlFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function parseBrl(value: string): number {
  const normalized = value.includes(',') ? value.replace(/\./g, '').replace(',', '.') : value;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

// Soma accruedBalanceBrl das linhas cujo payoutRequest.id está no conjunto informado — usado
// tanto para o total da seleção (D-5) quanto para o total do lote pendente de confirmação (D-14).
function sumAccruedBalanceForRequestIds(rows: FmzCoOwnerPayoutRow[], requestIds: Iterable<string>): number {
  const ids = requestIds instanceof Set ? requestIds : new Set(requestIds);
  return rows
    .filter((row) => row.payoutRequest && ids.has(row.payoutRequest.id))
    .reduce((sum, row) => sum + parseBrl(row.accruedBalanceBrl), 0);
}

// Ids de payoutRequest aprovaveis (estado 'pending_approval' com pedido real) entre as
// transações informadas — mesma regra usada dentro de cada card (D-14), aqui aplicada ao
// conjunto inteiro para o botão global do header.
function collectApprovableRequestIds(transactions: FmzCoOwnerPayoutTransaction[]): string[] {
  return transactions.flatMap((transaction) =>
    transaction.rows
      .filter((row) => deriveRowState(row) === 'pending_approval' && row.payoutRequest)
      .map((row) => row.payoutRequest!.id),
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FmzAdminCoOwnerPayoutsList() {
  const hook = useFmzAdminCoOwnerPayouts();

  const [typeFilter, setTypeFilter] = useState<FmzAdminCoOwnerPayoutsTypeFilter>('');
  const [pendingApprove, setPendingApprove] = useState<FmzCoOwnerPayoutRow | null>(null);
  const [pendingReject, setPendingReject] = useState<FmzCoOwnerPayoutRow | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [pendingBatchIds, setPendingBatchIds] = useState<string[] | null>(null);
  const [toast, setToast] = useState<{ message: string; ok: boolean } | null>(null);

  const notify = useCallback((message: string, ok: boolean) => {
    setToast({ message, ok });
    window.setTimeout(() => setToast(null), TOAST_DURATION_MS);
  }, []);

  // ── Filtro de tipo (D-13) — aplicado sobre os cards já agrupados ────────────

  const filteredTransactions = useMemo(
    () => hook.transactions.filter((transaction) => !typeFilter || transaction.sourceType === typeFilter),
    [hook.transactions, typeFilter],
  );

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

  // ── Approve em lote (D-5/D-14) — 3 gatilhos (seleção, rodapé do card, botão global), ────────
  // ── mesmo destino: pendingBatchIds abre o modal único de confirmação ─────────────────────────

  const selectedCount = hook.selectedRequestIds.size;
  const selectedTotalBrl = useMemo(
    () => brlFormatter.format(sumAccruedBalanceForRequestIds(hook.rows, hook.selectedRequestIds)),
    [hook.rows, hook.selectedRequestIds],
  );

  const globalEligibleIds = useMemo(() => collectApprovableRequestIds(filteredTransactions), [filteredTransactions]);

  const pendingBatchTotalBrl = useMemo(
    () => brlFormatter.format(sumAccruedBalanceForRequestIds(hook.rows, pendingBatchIds ?? [])),
    [pendingBatchIds, hook.rows],
  );

  const handleConfirmBatch = useCallback(async () => {
    if (!pendingBatchIds) return;
    const results = await hook.approveEligible(pendingBatchIds);
    setPendingBatchIds(null);
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
  }, [pendingBatchIds, hook, notify]);

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

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="mb-1 text-[22px] font-bold text-fmz-navy">Pagamentos a co-owners</h1>
          <p className="text-[13px] text-fmz-text-muted">
            Aluguel e venda de tokens — aprove ou rejeite os pedidos de PIX gerados pelo job mensal.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setPendingBatchIds(globalEligibleIds)}
          disabled={globalEligibleIds.length === 0}
          className="inline-flex items-center gap-1.5 rounded-[10px] border-[1.5px] border-[#C8A020] bg-[#F5C842] px-3.5 py-2 text-[13px] font-bold text-fmz-navy shadow-[0_2px_8px_rgba(245,200,66,0.25)] transition-all hover:-translate-y-0.5 hover:bg-[#f0c030] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:-translate-y-0"
        >
          <Send size={14} />
          {globalEligibleIds.length === 0 ? 'Todos processados' : `Processar ${globalEligibleIds.length} PIX elegíve${globalEligibleIds.length === 1 ? 'l' : 'is'}`}
        </button>
      </div>

      <FmzFormAlert error={hook.listError ?? hook.approveError ?? hook.rejectError ?? hook.batchApproveError} />

      <FmzAdminCoOwnerPayoutsSummary summary={hook.summary} />

      <div className="mb-5 flex flex-wrap items-center gap-2.5">
        <span className="text-[12px] font-medium text-fmz-text-muted">Filtrar:</span>

        <FmzSelect
          value={hook.filters.propertyTokenizationId ?? ''}
          onChange={(e) => hook.setFilter({ propertyTokenizationId: e.target.value || undefined })}
          wrapperClassName={FILTER_SELECT_WRAPPER_CLASS}
          className={FILTER_SELECT_TEXT_CLASS}
        >
          <option value="">Todos os imóveis</option>
          {hook.availableProperties.map((property) => (
            <option key={property.tokenizationId} value={property.tokenizationId}>{property.name}</option>
          ))}
        </FmzSelect>

        <FmzSelect
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as FmzAdminCoOwnerPayoutsTypeFilter)}
          wrapperClassName={FILTER_SELECT_WRAPPER_CLASS}
          className={FILTER_SELECT_TEXT_CLASS}
        >
          {TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </FmzSelect>

        <FmzSelect
          value={hook.filters.status ?? ''}
          onChange={(e) => hook.setFilter({ status: (e.target.value || undefined) as FmzPayoutRequestStatus | undefined })}
          wrapperClassName={FILTER_SELECT_WRAPPER_CLASS}
          className={FILTER_SELECT_TEXT_CLASS}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </FmzSelect>

        <span className="h-5 w-px bg-fmz-border-light" aria-hidden="true" />

        <FmzSelect
          value={hook.filters.competenceMonth}
          onChange={(e) => hook.setFilter({ competenceMonth: e.target.value })}
          wrapperClassName={FILTER_SELECT_WRAPPER_CLASS}
          className={FILTER_SELECT_TEXT_CLASS}
        >
          {COMPETENCE_MONTH_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </FmzSelect>

        {hook.listLoading && <Loader2 size={16} className="animate-spin text-[#9AA3B0]" />}
      </div>

      {hook.listLoading ? (
        <FmzAdminListSkeleton rows={5} />
      ) : filteredTransactions.length === 0 ? (
        <div className="rounded-2xl border border-fmz-border-light bg-white p-8 text-center text-[13.5px] text-fmz-text-muted">
          Nenhuma transação encontrada com os filtros selecionados.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTransactions.map((transaction, index) => (
            <FmzAdminCoOwnerPayoutTransactionCard
              key={`${transaction.sourceType}:${transaction.sourceReferenceId}`}
              transaction={transaction}
              defaultOpen={index === 0}
              selectedRequestIds={hook.selectedRequestIds}
              onToggleSelect={hook.toggleSelected}
              onApproveClick={setPendingApprove}
              onRejectClick={setPendingReject}
              onApproveEligible={setPendingBatchIds}
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
            onClick={() => setPendingBatchIds([...hook.selectedRequestIds])}
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
        isOpen={pendingBatchIds !== null}
        variant="batch"
        busy={hook.batchApproving}
        title={`Aprovar ${pendingBatchIds?.length ?? 0} pagamento(s)?`}
        description={`Isto envia ${pendingBatchIds?.length ?? 0} PIX real(is) via Asaas, totalizando ${pendingBatchTotalBrl}.`}
        confirmLabel="Aprovar todos"
        onConfirm={handleConfirmBatch}
        onCancel={() => setPendingBatchIds(null)}
      />
    </div>
  );
}
