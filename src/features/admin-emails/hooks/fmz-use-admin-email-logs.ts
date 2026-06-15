'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchEmailLogs, type FmzEmailLog, type FmzEmailLogsFilters } from '../services/fmz-admin-email-api';

const DEFAULT_LIMIT = 20;

export type FmzAdminEmailLogsState = {
  logs: FmzEmailLog[];
  total: number;
  totalPages: number;
  loading: boolean;
  filters: FmzEmailLogsFilters;
};

export type FmzAdminEmailLogsActions = {
  setFilter: (patch: Partial<FmzEmailLogsFilters>) => void;
};

export type FmzAdminEmailLogsHook = FmzAdminEmailLogsState & FmzAdminEmailLogsActions;

export function useFmzAdminEmailLogs(): FmzAdminEmailLogsHook {
  const [logs, setLogs]             = useState<FmzEmailLog[]>([]);
  const [total, setTotal]           = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading]       = useState(true);
  const [filters, setFiltersState]  = useState<FmzEmailLogsFilters>({
    page: 1,
    limit: DEFAULT_LIMIT,
  });

  const fetchGenerationRef = useRef(0);

  const fetchLogs = useCallback(async (activeFilters: FmzEmailLogsFilters) => {
    const generation = ++fetchGenerationRef.current;
    setLoading(true);
    try {
      const result = await fetchEmailLogs(activeFilters);
      if (generation !== fetchGenerationRef.current) return;
      setLogs(result.logs);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch {
      if (generation !== fetchGenerationRef.current) return;
      setLogs([]);
    } finally {
      if (generation === fetchGenerationRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchLogs(filters);
  }, [fetchLogs, filters]);

  const setFilter = useCallback((patch: Partial<FmzEmailLogsFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...patch, page: patch.page ?? 1 }));
  }, []);

  return { logs, total, totalPages, loading, filters, setFilter };
}
