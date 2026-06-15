'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchAdminTokenOrders, fetchTokenOrderDeliveryEvents } from '../services/fmz-admin-token-orders-api';
import { buildTimeline } from '../domain';
import { normalizeFmzApiError, type FmzNormalizedApiError } from '../../api-errors/domain';
import type {
  FmzAdminTokenOrder,
  FmzAdminTokenOrdersSummary,
  FmzAdminTokenOrdersPagination,
  FmzAdminTokenOrdersFilters,
  FmzDeliveryEvent,
  FmzTokenOrderTimelineEvent,
} from '../domain';

// ─── State types ──────────────────────────────────────────────────────────────

export type FmzAdminTokenOrdersState = {
  filters: FmzAdminTokenOrdersFilters;
  orders: FmzAdminTokenOrder[];
  summary: FmzAdminTokenOrdersSummary;
  pagination: FmzAdminTokenOrdersPagination;
  listLoading: boolean;
  listError: FmzNormalizedApiError | null;
  expandedOrderId: string | null;
  timelineLoading: boolean;
  timelineError: FmzNormalizedApiError | null;
};

export type FmzAdminTokenOrdersActions = {
  setFilter: (patch: Partial<FmzAdminTokenOrdersFilters>) => void;
  loadMore: () => void;
  expandOrder: (orderId: string) => void;
  collapseOrder: () => void;
  getTimeline: (orderId: string) => FmzTokenOrderTimelineEvent[];
};

export type FmzAdminTokenOrdersHook = FmzAdminTokenOrdersState & FmzAdminTokenOrdersActions;

// ─── Initial values ───────────────────────────────────────────────────────────

const INITIAL_SUMMARY: FmzAdminTokenOrdersSummary = {
  total: 0, completed: 0, error: 0, refunded: 0, pending: 0, cancelled: 0,
};

const INITIAL_PAGINATION: FmzAdminTokenOrdersPagination = {
  total: 0, offset: 0, limit: 50, hasMore: false,
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useFmzAdminTokenOrders(): FmzAdminTokenOrdersHook {
  const [filters, setFiltersState]       = useState<FmzAdminTokenOrdersFilters>({});
  const [orders, setOrders]              = useState<FmzAdminTokenOrder[]>([]);
  const [summary, setSummary]            = useState<FmzAdminTokenOrdersSummary>(INITIAL_SUMMARY);
  const [pagination, setPagination]      = useState<FmzAdminTokenOrdersPagination>(INITIAL_PAGINATION);
  const [listLoading, setListLoading]    = useState(true);
  const [listError, setListError]        = useState<FmzNormalizedApiError | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineError, setTimelineError]     = useState<FmzNormalizedApiError | null>(null);

  // Cache em memória: Map<orderId, deliveryEvents[]> para evitar re-fetch (D-5).
  const deliveryEventsCache = useRef<Map<string, FmzDeliveryEvent[]>>(new Map());
  // Cache de timelines calculadas: Map<orderId, FmzTokenOrderTimelineEvent[]>
  const timelineCache = useRef<Map<string, FmzTokenOrderTimelineEvent[]>>(new Map());

  const fetchGenerationRef = useRef(0);

  // ── Fetch list ──────────────────────────────────────────────────────────────

  const fetchList = useCallback(async (activeFilters: FmzAdminTokenOrdersFilters) => {
    const generation = ++fetchGenerationRef.current;
    setListLoading(true);
    setListError(null);
    try {
      const response = await fetchAdminTokenOrders(activeFilters);
      if (generation !== fetchGenerationRef.current) return;
      setOrders(response.orders);
      setSummary(response.summary);
      setPagination(response.pagination);
      // Invalida cache de timelines ao recarregar a lista
      deliveryEventsCache.current.clear();
      timelineCache.current.clear();
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

  const setFilter = useCallback((patch: Partial<FmzAdminTokenOrdersFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...patch }));
  }, []);

  // ── Load more (appends next page) ───────────────────────────────────────────

  const loadMore = useCallback(async () => {
    if (!pagination.hasMore || listLoading) return;
    const generation = ++fetchGenerationRef.current;
    setListLoading(true);
    setListError(null);
    try {
      const response = await fetchAdminTokenOrders(filters, {
        offset: pagination.offset + pagination.limit,
        limit:  pagination.limit,
      });
      if (generation !== fetchGenerationRef.current) return;
      setOrders((prev) => [...prev, ...response.orders]);
      setSummary(response.summary);
      setPagination(response.pagination);
    } catch (err) {
      if (generation !== fetchGenerationRef.current) return;
      setListError(normalizeFmzApiError(err));
    } finally {
      if (generation === fetchGenerationRef.current) setListLoading(false);
    }
  }, [filters, pagination.hasMore, pagination.offset, pagination.limit, listLoading]);

  // ── Expand/collapse + lazy load delivery events ──────────────────────────────

  const expandOrder = useCallback(async (orderId: string) => {
    setExpandedOrderId(orderId);

    if (deliveryEventsCache.current.has(orderId)) return;

    setTimelineLoading(true);
    setTimelineError(null);
    try {
      const events = await fetchTokenOrderDeliveryEvents(orderId);
      deliveryEventsCache.current.set(orderId, events);

      // Pré-computa a timeline para este orderId
      const order = orders.find((o) => o.id === orderId);
      if (order) {
        timelineCache.current.set(orderId, buildTimeline(order, events));
      }
    } catch (err) {
      setTimelineError(normalizeFmzApiError(err));
      deliveryEventsCache.current.set(orderId, []);
    } finally {
      setTimelineLoading(false);
    }
  }, [orders]);

  const collapseOrder = useCallback(() => {
    setExpandedOrderId(null);
  }, []);

  // ── Get timeline ─────────────────────────────────────────────────────────────

  const getTimeline = useCallback((orderId: string): FmzTokenOrderTimelineEvent[] => {
    if (timelineCache.current.has(orderId)) {
      return timelineCache.current.get(orderId)!;
    }
    // Ainda carregando ou sem cache: retorna eventos sintéticos apenas
    const order = orders.find((o) => o.id === orderId);
    if (!order) return [];
    const partialTimeline = buildTimeline(order, []);
    return partialTimeline;
  }, [orders]);

  return {
    filters,
    orders,
    summary,
    pagination,
    listLoading,
    listError,
    expandedOrderId,
    timelineLoading,
    timelineError,
    setFilter,
    loadMore,
    expandOrder,
    collapseOrder,
    getTimeline,
  };
}
