'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchAdminDashboardOverview,
  fetchAdminActivityFeed,
} from '../services/fmz-admin-dashboard-api';
import type {
  FmzAdminDashboardOverview,
  FmzAdminActivityEvent,
} from '../domain/fmz-admin-dashboard.types';

const OVERVIEW_REFRESH_MS = 5 * 60 * 1000;
const ACTIVITY_REFRESH_MS = 30 * 1000;

export type FmzAdminDashboardOverviewState = {
  overview: FmzAdminDashboardOverview | null;
  loading:  boolean;
  error:    string | null;
  refresh:  () => void;
};

export type FmzAdminActivityFeedState = {
  events:  FmzAdminActivityEvent[];
  loading: boolean;
  error:   string | null;
};

export function useAdminDashboardOverview(): FmzAdminDashboardOverviewState {
  const [overview, setOverview] = useState<FmzAdminDashboardOverview | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const generationRef           = useRef(0);

  const load = useCallback(async () => {
    const generation = ++generationRef.current;
    setLoading(true);
    try {
      const data = await fetchAdminDashboardOverview();
      if (generation !== generationRef.current) return;
      setOverview(data);
      setError(null);
    } catch (err) {
      console.error('[useAdminDashboardOverview] fetch failed:', err);
      if (generation !== generationRef.current) return;
      setError('Não foi possível carregar os dados do dashboard.');
    } finally {
      if (generation === generationRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const intervalId = setInterval(() => void load(), OVERVIEW_REFRESH_MS);
    return () => clearInterval(intervalId);
  }, [load]);

  return { overview, loading, error, refresh: load };
}

export function useAdminActivityFeed(limit = 5): FmzAdminActivityFeedState {
  const [events, setEvents] = useState<FmzAdminActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const generationRef         = useRef(0);

  const load = useCallback(async () => {
    const generation = ++generationRef.current;
    setLoading(true);
    try {
      const data = await fetchAdminActivityFeed(limit);
      if (generation !== generationRef.current) return;
      setEvents(data);
      setError(null);
    } catch (err) {
      console.error('[useAdminActivityFeed] fetch failed:', err);
      if (generation !== generationRef.current) return;
      setError('Não foi possível carregar o feed de atividade.');
    } finally {
      if (generation === generationRef.current) setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    void load();
    const intervalId = setInterval(() => void load(), ACTIVITY_REFRESH_MS);
    return () => clearInterval(intervalId);
  }, [load]);

  return { events, loading, error };
}
