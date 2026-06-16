'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchInvites, type FmzFetchInvitesFilters, type FmzTenantInvite } from '../services/fmz-admin-email-api';

const DEFAULT_LIMIT = 20;

export type FmzAdminInvitesState = {
  invites: FmzTenantInvite[];
  total: number;
  totalPages: number;
  loading: boolean;
  filters: FmzFetchInvitesFilters;
};

export type FmzAdminInvitesActions = {
  setFilter: (patch: Partial<FmzFetchInvitesFilters>) => void;
};

export type FmzAdminInvitesHook = FmzAdminInvitesState & FmzAdminInvitesActions;

// Mirrors useFmzAdminEmailLogs (D-14 / AE-13 history view) — same pagination + staleness-guard
// shape, kept as its own hook since invites have a distinct fetch fn and response shape.
export function useFmzAdminInvites(): FmzAdminInvitesHook {
  const [invites, setInvites]       = useState<FmzTenantInvite[]>([]);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(true);
  const [filters, setFiltersState]  = useState<FmzFetchInvitesFilters>({
    page: 1,
    limit: DEFAULT_LIMIT,
  });

  const fetchGenerationRef = useRef(0);

  const loadInvites = useCallback(async (activeFilters: FmzFetchInvitesFilters) => {
    const generation = ++fetchGenerationRef.current;
    setLoading(true);
    try {
      const result = await fetchInvites(activeFilters);
      if (generation !== fetchGenerationRef.current) return;
      setInvites(result.invites);
      setTotal(result.total);
    } catch {
      if (generation !== fetchGenerationRef.current) return;
      setInvites([]);
      setTotal(0);
    } finally {
      if (generation === fetchGenerationRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInvites(filters);
  }, [loadInvites, filters]);

  const setFilter = useCallback((patch: Partial<FmzFetchInvitesFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...patch, page: patch.page ?? 1 }));
  }, []);

  const limit = filters.limit ?? DEFAULT_LIMIT;
  const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;

  return { invites, total, totalPages, loading, filters, setFilter };
}
