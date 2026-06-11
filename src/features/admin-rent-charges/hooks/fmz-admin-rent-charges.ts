'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  adjustAdminRentCharge,
  listAdminRentCharges,
  validateAdminRentCharge,
} from '../services/fmz-admin-rent-charges-api';
import { normalizeFmzApiError, type FmzNormalizedApiError } from '../../api-errors/domain';
import type {
  FmzAdminRentCharge,
  FmzAdminRentChargeFilters,
  FmzRentChargeAdjustPayload,
  FmzRentChargeEditableValues,
  FmzRentChargeSummary,
} from '../domain';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Retorna o mês atual no formato YYYY-MM-01, fuso América/São_Paulo. */
function currentCompetenceMonth(): string {
  const now = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }),
  );
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
}

// ─── State shape ──────────────────────────────────────────────────────────────

export type FmzAdminRentChargesState = {
  filters: FmzAdminRentChargeFilters;
  charges: FmzAdminRentCharge[];
  summary: FmzRentChargeSummary;
  listLoading: boolean;
  listError: FmzNormalizedApiError | null;
  /** Id da linha em edição inline; null quando nenhuma aberta. */
  editingId: string | null;
  /** Valores do draft para o modo de edição inline. */
  draftValues: FmzRentChargeEditableValues | null;
  adjusting: boolean;
  adjustError: FmzNormalizedApiError | null;
  validating: boolean;
  validateError: FmzNormalizedApiError | null;
};

export type FmzAdminRentChargesActions = {
  setFilter: (patch: Partial<FmzAdminRentChargeFilters>) => void;
  startEditing: (charge: FmzAdminRentCharge) => void;
  cancelEditing: () => void;
  setDraftField: (
    field: keyof FmzRentChargeEditableValues,
    value: string,
  ) => void;
  adjustCharge: (id: string, payload: FmzRentChargeAdjustPayload) => Promise<boolean>;
  validateCharge: (id: string) => Promise<boolean>;
};

export type FmzAdminRentChargesHook = FmzAdminRentChargesState &
  FmzAdminRentChargesActions;

// ─── Pure helpers ─────────────────────────────────────────────────────────────

/**
 * Aplica o resultado de um ajuste manual a uma cobrança existente.
 * Função pura — sem efeitos colaterais, fácil de testar isoladamente.
 */
function applyAdjustResult(
  charge: FmzAdminRentCharge,
  payload: FmzRentChargeAdjustPayload,
  grossAmount: string,
  hasManualAdjustment: boolean,
): FmzAdminRentCharge {
  return {
    ...charge,
    hasManualAdjustment,
    calculatedAmounts: {
      ...charge.calculatedAmounts,
      tokenPurchase: payload.tokenPurchaseAmount,
      discountedRent: payload.discountedRentAmount,
      platformAdminFee: payload.platformAdminFeeAmount,
      tokenPurchaseFee: payload.tokenPurchaseFeeAmount,
      gross: grossAmount,
    },
  };
}

// ─── Initial values ───────────────────────────────────────────────────────────

const INITIAL_SUMMARY: FmzRentChargeSummary = {
  pendingCount: 0,
  doneCount: 0,
  totalPendingVolumeBrl: '0.00',
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Gerencia estado da página admin de boletos de aluguel:
 * filtros, listagem, resumo e ações de ajuste/validação por linha.
 */
export function useFmzAdminRentCharges(): FmzAdminRentChargesHook {
  const [filters, setFiltersState] = useState<FmzAdminRentChargeFilters>({
    competenceMonth: currentCompetenceMonth(),
    status: 'pending_validation',
  });
  const [charges, setCharges] = useState<FmzAdminRentCharge[]>([]);
  const [summary, setSummary] = useState<FmzRentChargeSummary>(INITIAL_SUMMARY);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<FmzNormalizedApiError | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftValues, setDraftValues] = useState<FmzRentChargeEditableValues | null>(null);
  const [adjusting, setAdjusting] = useState(false);
  const [adjustError, setAdjustError] = useState<FmzNormalizedApiError | null>(null);
  const [validating, setValidating] = useState(false);
  const [validateError, setValidateError] = useState<FmzNormalizedApiError | null>(null);

  // Ref de geração: incrementado a cada fetch; descarta respostas de fetches obsoletos.
  const fetchGenerationRef = useRef(0);

  // ── Fetch list ──────────────────────────────────────────────────────────────

  const fetchList = useCallback(async (activeFilters: FmzAdminRentChargeFilters) => {
    const generation = ++fetchGenerationRef.current;

    setListLoading(true);
    setListError(null);
    try {
      const response = await listAdminRentCharges(activeFilters);
      if (generation !== fetchGenerationRef.current) return;
      setCharges(response.charges);
      setSummary(response.summary);
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

  // ── Filter ──────────────────────────────────────────────────────────────────

  const setFilter = useCallback((patch: Partial<FmzAdminRentChargeFilters>) => {
    setFiltersState((previous) => ({ ...previous, ...patch }));
    setEditingId(null);
    setDraftValues(null);
  }, []);

  // ── Edit inline ─────────────────────────────────────────────────────────────

  const startEditing = useCallback((charge: FmzAdminRentCharge) => {
    const src = charge.hasManualAdjustment
      ? charge.calculatedAmounts
      : charge.amounts;
    setEditingId(charge.id);
    setDraftValues({
      tokenPurchase: src.tokenPurchase,
      discountedRent: src.discountedRent,
      platformAdminFee: src.platformAdminFee,
      tokenPurchaseFee: src.tokenPurchaseFee,
    });
    setAdjustError(null);
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingId(null);
    setDraftValues(null);
    setAdjustError(null);
  }, []);

  const setDraftField = useCallback(
    (field: keyof FmzRentChargeEditableValues, value: string) => {
      setDraftValues((previous) => (previous ? { ...previous, [field]: value } : previous));
    },
    [],
  );

  // ── Adjust ──────────────────────────────────────────────────────────────────

  const adjustCharge = useCallback(
    async (id: string, payload: FmzRentChargeAdjustPayload): Promise<boolean> => {
      setAdjusting(true);
      setAdjustError(null);
      try {
        const result = await adjustAdminRentCharge(id, payload);
        setCharges((previous) =>
          previous.map((charge) =>
            charge.id === id
              ? applyAdjustResult(charge, payload, result.grossAmount, result.hasManualAdjustment)
              : charge,
          ),
        );
        setEditingId(null);
        setDraftValues(null);
        return true;
      } catch (err) {
        setAdjustError(normalizeFmzApiError(err));
        return false;
      } finally {
        setAdjusting(false);
      }
    },
    [],
  );

  // ── Validate ─────────────────────────────────────────────────────────────────

  const validateCharge = useCallback(async (id: string): Promise<boolean> => {
    setValidating(true);
    setValidateError(null);
    try {
      await validateAdminRentCharge(id);
      // Reload list para garantir status atualizado do servidor
      await fetchList(filters);
      return true;
    } catch (err) {
      setValidateError(normalizeFmzApiError(err));
      return false;
    } finally {
      setValidating(false);
    }
  }, [fetchList, filters]);

  return {
    filters,
    charges,
    summary,
    listLoading,
    listError,
    editingId,
    draftValues,
    adjusting,
    adjustError,
    validating,
    validateError,
    setFilter,
    startEditing,
    cancelEditing,
    setDraftField,
    adjustCharge,
    validateCharge,
  };
}
