'use client';

import { useCallback, useMemo, useState } from 'react';
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

export function useFmzAdminPagination(initialLimit = DEFAULT_LIMIT): FmzAdminPaginationState {
  const [page, setPageState] = useState(1);
  const [limit, setLimitState] = useState(() => (Number.isFinite(initialLimit) && initialLimit > 0 ? initialLimit : 10));
  const [search, setSearchState] = useState('');
  const [meta, setMeta] = useState<FmzAdminPaginationMeta>({
    page: 1,
    limit: Number.isFinite(initialLimit) && initialLimit > 0 ? initialLimit : 10,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const setPage = useCallback((nextPage: number) => {
    setPageState(Math.max(1, Math.floor(nextPage)));
  }, []);

  const setLimit = useCallback((nextLimit: number) => {
    const safeLimit = Math.max(1, Math.floor(nextLimit));
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
