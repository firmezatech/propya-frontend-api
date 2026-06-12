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
  adjusting: boolean;
  adjustError: FmzNormalizedApiError | null;
  validating: boolean;
  validateError: FmzNormalizedApiError | null;
};

export type FmzAdminRentChargesActions = {
  setFilter: (patch: Partial<FmzAdminRentChargeFilters>) => void;
  adjustCharge: (id: string, payload: FmzRentChargeAdjustPayload) => Promise<boolean>;
  validateCharge: (id: string) => Promise<boolean>;
};

export type FmzAdminRentChargesHook = FmzAdminRentChargesState &
  FmzAdminRentChargesActions;

// ─── Pure helpers ─────────────────────────────────────────────────────────────

// amounts = original system calculation (immutable).
// calculatedAmounts = effective billing amounts (updated when admin adjusts).
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

export function useFmzAdminRentCharges(): FmzAdminRentChargesHook {
  const [filters, setFiltersState] = useState<FmzAdminRentChargeFilters>({
    competenceMonth: currentCompetenceMonth(),
    status: 'pending_validation',
  });
  const [charges, setCharges] = useState<FmzAdminRentCharge[]>([]);
  const [summary, setSummary] = useState<FmzRentChargeSummary>(INITIAL_SUMMARY);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<FmzNormalizedApiError | null>(null);
  const [adjusting, setAdjusting] = useState(false);
  const [adjustError, setAdjustError] = useState<FmzNormalizedApiError | null>(null);
  const [validating, setValidating] = useState(false);
  const [validateError, setValidateError] = useState<FmzNormalizedApiError | null>(null);

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
  }, []);

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
    adjusting,
    adjustError,
    validating,
    validateError,
    setFilter,
    adjustCharge,
    validateCharge,
  };
}
