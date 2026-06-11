'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { listAdminKycUsers, releaseKycUser } from '../services/fmz-admin-kyc-api';
import { normalizeFmzApiError, type FmzNormalizedApiError } from '../../api-errors/domain';
import type {
  FmzAdminKycFilters,
  FmzAdminKycUser,
  FmzKycDisplayStatus,
  FmzKycSummary,
} from '../domain';

// ─── State shape ──────────────────────────────────────────────────────────────

export type FmzAdminKycState = {
  filters: FmzAdminKycFilters;
  users: FmzAdminKycUser[];
  summary: FmzKycSummary;
  total: number;
  nextCursor: string | null;
  listLoading: boolean;
  listError: FmzNormalizedApiError | null;
  releasing: boolean;
  releaseError: FmzNormalizedApiError | null;
};

export type FmzAdminKycActions = {
  setSearch: (value: string) => void;
  setStatus: (value: FmzKycDisplayStatus | '') => void;
  loadMore: () => void;
  releaseUser: (userId: string) => Promise<boolean>;
};

export type FmzAdminKycHook = FmzAdminKycState & FmzAdminKycActions;

// ─── Constants ────────────────────────────────────────────────────────────────

const INITIAL_SUMMARY: FmzKycSummary = {
  pendingCount: 0,
  inReviewCount: 0,
  approvedCount: 0,
  declinedCount: 0,
};

const INITIAL_FILTERS: FmzAdminKycFilters = {
  search: '',
  propertyId: '',
  propertyFilter: 'all',
  status: '',
  cursor: null,
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useFmzAdminKyc(): FmzAdminKycHook {
  const [filters, setFilters] = useState<FmzAdminKycFilters>(INITIAL_FILTERS);
  const [users, setUsers] = useState<FmzAdminKycUser[]>([]);
  const [summary, setSummary] = useState<FmzKycSummary>(INITIAL_SUMMARY);
  const [total, setTotal] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<FmzNormalizedApiError | null>(null);
  const [releasing, setReleasing] = useState(false);
  const [releaseError, setReleaseError] = useState<FmzNormalizedApiError | null>(null);

  // Descarta respostas de fetches obsoletos (race condition guard)
  const fetchGenerationRef = useRef(0);
  // Debounce timer para busca por texto
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Fetch ───────────────────────────────────────────────────────────────────

  const fetchList = useCallback(
    async (activeFilters: FmzAdminKycFilters, append = false) => {
      const generation = ++fetchGenerationRef.current;

      setListLoading(true);
      setListError(null);
      try {
        const response = await listAdminKycUsers(activeFilters);
        if (generation !== fetchGenerationRef.current) return;

        setUsers((prev) => (append ? [...prev, ...response.users] : response.users));
        setSummary(response.summary);
        setTotal(response.total);
        setNextCursor(response.nextCursor);
      } catch (err) {
        if (generation !== fetchGenerationRef.current) return;
        setListError(normalizeFmzApiError(err));
      } finally {
        if (generation === fetchGenerationRef.current) setListLoading(false);
      }
    },
    [],
  );

  // Limpa debounce pendente no unmount
  useEffect(() => {
    return () => { if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current); };
  }, []);

  // Fetch inicial e re-fetch quando filtros mudam (exceto cursor)
  useEffect(() => {
    const { cursor: _, ...withoutCursor } = filters;
    void fetchList({ ...withoutCursor, cursor: null });
  }, [fetchList, filters.search, filters.status, filters.propertyId, filters.propertyFilter]);

  // ── Actions ─────────────────────────────────────────────────────────────────

  const setSearch = useCallback((value: string) => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: value, cursor: null }));
    }, 300);
  }, []);

  const setStatus = useCallback((value: FmzKycDisplayStatus | '') => {
    setFilters((prev) => ({ ...prev, status: value, cursor: null }));
  }, []);

  const loadMore = useCallback(() => {
    if (!nextCursor || listLoading) return;
    const nextFilters = { ...filters, cursor: nextCursor };
    setFilters(nextFilters);
    void fetchList(nextFilters, true);
  }, [nextCursor, listLoading, filters, fetchList]);

  const releaseUser = useCallback(async (userId: string): Promise<boolean> => {
    setReleasing(true);
    setReleaseError(null);
    try {
      await releaseKycUser(userId);
      // Atualiza o usuário localmente sem reload da lista inteira
      setUsers((prev) =>
        prev.map((u) =>
          u.userId === userId ? { ...u, releasedForResubmission: true } : u,
        ),
      );
      return true;
    } catch (err) {
      setReleaseError(normalizeFmzApiError(err));
      return false;
    } finally {
      setReleasing(false);
    }
  }, []);

  return {
    filters,
    users,
    summary,
    total,
    nextCursor,
    listLoading,
    listError,
    releasing,
    releaseError,
    setSearch,
    setStatus,
    loadMore,
    releaseUser,
  };
}
