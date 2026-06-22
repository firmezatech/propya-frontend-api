'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  approvePayoutRequest,
  approvePayoutRequestsBatch,
  listCoOwnerPayouts,
  rejectPayoutRequest,
} from '../services/fmz-admin-co-owner-payouts-api';
import { normalizeFmzApiError, type FmzNormalizedApiError } from '../../api-errors/domain';
import { groupRowsByTransaction } from '../domain/fmz-admin-co-owner-payouts-grouping';
import type {
  FmzApproveBatchItemResult,
  FmzCoOwnerPayoutRow,
  FmzCoOwnerPayoutsFilters,
  FmzCoOwnerPayoutsSummary,
  FmzCoOwnerPayoutTransaction,
} from '../domain';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Retorna o mês atual no formato YYYY-MM-01, fuso América/São_Paulo. */
function currentCompetenceMonth(): string {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
}

// Linhas elegíveis para seleção em lote (D-5) — só as que têm um pedido pendente.
const PENDING_APPROVAL_STATUS = 'pending_approval';

const isSelectable = (row: FmzCoOwnerPayoutRow): boolean =>
  row.payoutRequest?.status === PENDING_APPROVAL_STATUS;

// ─── State shape ──────────────────────────────────────────────────────────────

const INITIAL_SUMMARY: FmzCoOwnerPayoutsSummary = {
  totalPendingBrl: '0.00',
  coOwnersAwaitingCount: 0,
  openTransactionsCount: 0,
  belowMinimumCount: 0,
  belowMinimumTotalBrl: '0.00',
};

export type FmzAdminCoOwnerPayoutsState = {
  filters: FmzCoOwnerPayoutsFilters;
  rows: FmzCoOwnerPayoutRow[];
  transactions: FmzCoOwnerPayoutTransaction[];
  summary: FmzCoOwnerPayoutsSummary;
  /** Imóveis distintos vistos nas rows já carregadas — opções do filtro de imóvel (D-12). */
  availableProperties: Array<{ tokenizationId: string; name: string }>;
  listLoading: boolean;
  listError: FmzNormalizedApiError | null;
  approving: boolean;
  approveError: FmzNormalizedApiError | null;
  rejecting: boolean;
  rejectError: FmzNormalizedApiError | null;
  batchApproving: boolean;
  batchApproveError: FmzNormalizedApiError | null;
  selectedRequestIds: Set<string>;
};

export type FmzAdminCoOwnerPayoutsActions = {
  setFilter: (patch: Partial<FmzCoOwnerPayoutsFilters>) => void;
  approve: (requestId: string) => Promise<boolean>;
  reject: (requestId: string, reason?: string) => Promise<boolean>;
  /** Sem argumento, aprova selectedRequestIds (D-5). Com lista, aprova exatamente esses ids —
   * usado pelo rodapé "Aprovar N elegíveis" do card e pelo botão global do header (D-14). */
  approveEligible: (ids?: string[]) => Promise<FmzApproveBatchItemResult[] | null>;
  toggleSelected: (requestId: string) => void;
  clearSelection: () => void;
};

export type FmzAdminCoOwnerPayoutsHook = FmzAdminCoOwnerPayoutsState & FmzAdminCoOwnerPayoutsActions;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useFmzAdminCoOwnerPayouts(): FmzAdminCoOwnerPayoutsHook {
  const [filters, setFiltersState] = useState<FmzCoOwnerPayoutsFilters>({
    competenceMonth: currentCompetenceMonth(),
  });
  const [rows, setRows] = useState<FmzCoOwnerPayoutRow[]>([]);
  const [summary, setSummary] = useState<FmzCoOwnerPayoutsSummary>(INITIAL_SUMMARY);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<FmzNormalizedApiError | null>(null);
  const [approving, setApproving] = useState(false);
  const [approveError, setApproveError] = useState<FmzNormalizedApiError | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [rejectError, setRejectError] = useState<FmzNormalizedApiError | null>(null);
  const [batchApproving, setBatchApproving] = useState(false);
  const [batchApproveError, setBatchApproveError] = useState<FmzNormalizedApiError | null>(null);
  const [selectedRequestIds, setSelectedRequestIds] = useState<Set<string>>(new Set());

  const fetchGenerationRef = useRef(0);

  // ── Fetch list ──────────────────────────────────────────────────────────────

  const fetchList = useCallback(async (activeFilters: FmzCoOwnerPayoutsFilters) => {
    const generation = ++fetchGenerationRef.current;

    setListLoading(true);
    setListError(null);
    try {
      const response = await listCoOwnerPayouts(activeFilters);
      if (generation !== fetchGenerationRef.current) return;
      setRows(response.rows);
      setSummary(response.summary);
      setSelectedRequestIds(new Set());
    } catch (err) {
      if (generation !== fetchGenerationRef.current) return;
      setListError(normalizeFmzApiError(err));
    } finally {
      if (generation === fetchGenerationRef.current) setListLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchList(filters);
  }, [fetchList, filters]);

  const transactions = useMemo(() => groupRowsByTransaction(rows), [rows]);

  // ── Filter ──────────────────────────────────────────────────────────────────

  const setFilter = useCallback((patch: Partial<FmzCoOwnerPayoutsFilters>) => {
    setFiltersState((previous) => ({ ...previous, ...patch }));
  }, []);

  // ── Approve / reject (D-6: refetch completo após sucesso) ──────────────────

  const approve = useCallback(async (requestId: string): Promise<boolean> => {
    setApproving(true);
    setApproveError(null);
    try {
      await approvePayoutRequest(requestId);
      await fetchList(filters);
      return true;
    } catch (err) {
      setApproveError(normalizeFmzApiError(err));
      return false;
    } finally {
      setApproving(false);
    }
  }, [fetchList, filters]);

  const reject = useCallback(async (requestId: string, reason?: string): Promise<boolean> => {
    setRejecting(true);
    setRejectError(null);
    try {
      await rejectPayoutRequest(requestId, reason);
      await fetchList(filters);
      return true;
    } catch (err) {
      setRejectError(normalizeFmzApiError(err));
      return false;
    } finally {
      setRejecting(false);
    }
  }, [fetchList, filters]);

  // ── Seleção em lote (D-5) ────────────────────────────────────────────────────

  const toggleSelected = useCallback((requestId: string) => {
    setSelectedRequestIds((previous) => {
      const next = new Set(previous);
      if (next.has(requestId)) next.delete(requestId);
      else next.add(requestId);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelectedRequestIds(new Set()), []);

  // D-14: generalização de approveSelected — sem args, usa selectedRequestIds (D-5, barra fixa);
  // com lista explícita, aprova exatamente esses ids (rodapé do card / botão global do header).
  const approveEligible = useCallback(async (ids?: string[]): Promise<FmzApproveBatchItemResult[] | null> => {
    const targetIds = ids ?? [...selectedRequestIds];
    if (targetIds.length === 0) return null;

    setBatchApproving(true);
    setBatchApproveError(null);
    try {
      const results = await approvePayoutRequestsBatch(targetIds);
      await fetchList(filters);
      return results;
    } catch (err) {
      setBatchApproveError(normalizeFmzApiError(err));
      return null;
    } finally {
      setBatchApproving(false);
    }
  }, [selectedRequestIds, fetchList, filters]);

  // ── Filtro de imóvel (D-12) — opções derivadas das rows já carregadas, sem nova chamada ──────

  const availableProperties = useMemo(() => {
    const seen = new Map<string, { tokenizationId: string; name: string }>();
    for (const row of rows) {
      const tokenizationId = row.property.tokenizationId;
      if (!tokenizationId || seen.has(tokenizationId)) continue;
      seen.set(tokenizationId, { tokenizationId, name: row.property.name ?? 'Imóvel sem nome' });
    }
    return [...seen.values()];
  }, [rows]);

  return {
    filters,
    rows,
    transactions,
    summary,
    availableProperties,
    listLoading,
    listError,
    approving,
    approveError,
    rejecting,
    rejectError,
    batchApproving,
    batchApproveError,
    selectedRequestIds,
    setFilter,
    approve,
    reject,
    approveEligible,
    toggleSelected,
    clearSelection,
  };
}

export { isSelectable };
