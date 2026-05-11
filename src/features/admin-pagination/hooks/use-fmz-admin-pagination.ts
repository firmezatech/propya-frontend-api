'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FmzAdminPaginationMeta, FmzAdminPaginationRequest } from '../domain/fmz-admin-pagination.types';

export type FmzAdminPaginationState = FmzAdminPaginationMeta & {
  search: string;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setSearch: (search: string) => void;
  applyMeta: (meta: FmzAdminPaginationMeta) => void;
  request: FmzAdminPaginationRequest;
};

const DEFAULT_LIMIT = Number(process.env.NEXT_PUBLIC_FMZ_ADMIN_LIST_DEFAULT_LIMIT || 10);
const MIN_DYNAMIC_LIMIT = Number(process.env.NEXT_PUBLIC_FMZ_ADMIN_LIST_MIN_LIMIT || 4);
const MAX_DYNAMIC_LIMIT = Number(process.env.NEXT_PUBLIC_FMZ_ADMIN_LIST_MAX_LIMIT || 12);
const ESTIMATED_ROW_HEIGHT = Number(process.env.NEXT_PUBLIC_FMZ_ADMIN_LIST_ROW_HEIGHT || 104);
const RESERVED_VERTICAL_SPACE = Number(process.env.NEXT_PUBLIC_FMZ_ADMIN_LIST_RESERVED_HEIGHT || 360);

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

const safePositiveNumber = (value: number, fallback: number): number => (Number.isFinite(value) && value > 0 ? value : fallback);

const resolveDynamicLimit = (fallbackLimit: number): number => {
  if (typeof window === 'undefined') return fallbackLimit;

  const rowHeight = safePositiveNumber(ESTIMATED_ROW_HEIGHT, 104);
  const reservedHeight = safePositiveNumber(RESERVED_VERTICAL_SPACE, 360);
  const availableHeight = Math.max(0, window.innerHeight - reservedHeight);
  const calculatedLimit = Math.floor(availableHeight / rowHeight);

  return clamp(
    calculatedLimit || fallbackLimit,
    safePositiveNumber(MIN_DYNAMIC_LIMIT, 4),
    safePositiveNumber(MAX_DYNAMIC_LIMIT, 12),
  );
};

export function useFmzAdminPagination(initialLimit = DEFAULT_LIMIT): FmzAdminPaginationState {
  const fallbackLimit = safePositiveNumber(initialLimit, 10);
  const [page, setPageState] = useState(1);
  const [limit, setLimitState] = useState(() => resolveDynamicLimit(fallbackLimit));
  const [hasManualLimit, setHasManualLimit] = useState(false);
  const [search, setSearchState] = useState('');
  const [meta, setMeta] = useState<FmzAdminPaginationMeta>({
    page: 1,
    limit: resolveDynamicLimit(fallbackLimit),
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  useEffect(() => {
    if (hasManualLimit) return undefined;

    const syncDynamicLimit = () => {
      const nextLimit = resolveDynamicLimit(fallbackLimit);
      setLimitState((currentLimit) => {
        if (currentLimit === nextLimit) return currentLimit;
        setPageState(1);
        return nextLimit;
      });
    };

    syncDynamicLimit();
    window.addEventListener('resize', syncDynamicLimit);
    return () => window.removeEventListener('resize', syncDynamicLimit);
  }, [fallbackLimit, hasManualLimit]);

  const setPage = useCallback((nextPage: number) => {
    setPageState(Math.max(1, Math.floor(nextPage)));
  }, []);

  const setLimit = useCallback((nextLimit: number) => {
    const safeLimit = Math.max(1, Math.floor(nextLimit));
    setHasManualLimit(true);
    setLimitState(safeLimit);
    setPageState(1);
  }, []);

  const setSearch = useCallback((nextSearch: string) => {
    setSearchState(nextSearch);
    setPageState(1);
  }, []);

  const applyMeta = useCallback((nextMeta: FmzAdminPaginationMeta) => {
    setMeta(nextMeta);
    if (nextMeta.page !== page) setPageState(nextMeta.page);
    if (nextMeta.limit !== limit) setLimitState(nextMeta.limit);
  }, [limit, page]);

  const request = useMemo(() => ({ page, limit, search }), [page, limit, search]);

  return {
    ...meta,
    page,
    limit,
    search,
    setPage,
    setLimit,
    setSearch,
    applyMeta,
    request,
  };
}
