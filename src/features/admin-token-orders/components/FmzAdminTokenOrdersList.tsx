'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { useFmzAdminTokenOrders } from '../hooks/fmz-admin-token-orders';
import { FmzAdminTokenOrderRow } from './FmzAdminTokenOrderRow';
import { FmzTokenPurchaseReceiptModal } from './FmzTokenPurchaseReceiptModal';
import { FmzFormAlert } from '../../api-errors/components';
import { FmzAdminListSkeleton } from '../../../components/layout';
import { fmzCn } from '../../../lib/fmz-classnames';
import type { FmzAdminTokenOrder, FmzAdminOrderStatus } from '../domain';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: Array<{ value: FmzAdminOrderStatus | ''; label: string }> = [
  { value: '',          label: 'Todos os status' },
  { value: 'pending',   label: 'Pendente' },
  { value: 'completed', label: 'Concluída' },
  { value: 'error',     label: 'Com erro' },
  { value: 'refunded',  label: 'Reembolsada' },
  { value: 'cancelled', label: 'Cancelada' },
];

// ─── Summary strip ────────────────────────────────────────────────────────────

function SummaryStrip({ summary }: { summary: ReturnType<typeof useFmzAdminTokenOrders>['summary'] }) {
  const cards = [
    { label: 'Total',       value: summary.total },
    { label: 'Concluídas',  value: summary.completed },
    { label: 'Com erro',    value: summary.error },
    { label: 'Reembolsos',  value: summary.refunded },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {cards.map((card) => (
        <div key={card.label} className="bg-white rounded-lg border border-[#E8EAF0] px-4 py-3">
          <p className="text-xs text-[#9AA3B0]">{card.label}</p>
          <p className="text-2xl font-bold text-[#1E2A3B] mt-0.5">{card.value}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Filters bar ─────────────────────────────────────────────────────────────

function FiltersBar({
  search,
  status,
  onSearchChange,
  onStatusChange,
}: {
  search: string;
  status: FmzAdminOrderStatus | '';
  onSearchChange: (v: string) => void;
  onStatusChange: (v: FmzAdminOrderStatus | '') => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-4">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9AA3B0]" />
        <input
          type="text"
          placeholder="Buscar por nome ou ID da ordem"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border border-[#E8EAF0] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#3B5BDB] placeholder:text-[#9AA3B0]"
        />
      </div>

      {/* Status */}
      <select
        value={status}
        onChange={(e) => onStatusChange(e.target.value as FmzAdminOrderStatus | '')}
        className="py-2 px-3 text-sm border border-[#E8EAF0] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#3B5BDB] text-[#1E2A3B] bg-white"
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function FmzAdminTokenOrdersList() {
  const {
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
  } = useFmzAdminTokenOrders();

  const [receiptOrder, setReceiptOrder] = useState<FmzAdminTokenOrder | null>(null);

  const handleSearchChange = (value: string) => setFilter({ search: value || undefined });
  const handleStatusChange = (value: FmzAdminOrderStatus | '') => setFilter({ status: value || undefined });

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#1E2A3B]">Compras de Tokens</h1>
        <p className="text-sm text-[#6B7280] mt-0.5">Histórico de compras de tokens por usuários da plataforma</p>
      </div>

      {listError && (
        <div className="mb-4">
          <FmzFormAlert error={listError} />
        </div>
      )}

      {timelineError && (
        <div className="mb-4">
          <FmzFormAlert error={timelineError} />
        </div>
      )}

      <SummaryStrip summary={summary} />

      <FiltersBar
        search={filters.search ?? ''}
        status={filters.status ?? ''}
        onSearchChange={handleSearchChange}
        onStatusChange={handleStatusChange}
      />

      {listLoading && orders.length === 0 ? (
        <FmzAdminListSkeleton />
      ) : orders.length === 0 ? (
        <div className="text-center py-16 text-[#9AA3B0]">
          <p className="text-sm">Nenhuma ordem encontrada</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {orders.map((order) => {
              const isExpanded = expandedOrderId === order.id;
              return (
                <FmzAdminTokenOrderRow
                  key={order.id}
                  order={order}
                  isExpanded={isExpanded}
                  timeline={isExpanded ? getTimeline(order.id) : []}
                  timelineLoading={isExpanded && timelineLoading}
                  onExpand={() => expandOrder(order.id)}
                  onCollapse={collapseOrder}
                  onOpenReceipt={setReceiptOrder}
                />
              );
            })}
          </div>

          {pagination.hasMore && (
            <button
              type="button"
              onClick={loadMore}
              disabled={listLoading}
              className="w-full mt-2 py-3 text-sm text-[#3B5BDB] border border-[#E8EAF0] rounded-lg hover:bg-[#F7F8FA] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {listLoading
                ? 'Carregando…'
                : `Carregar mais (${pagination.total - orders.length} restantes)`}
            </button>
          )}
        </>
      )}

      {receiptOrder && (
        <FmzTokenPurchaseReceiptModal
          order={receiptOrder}
          onClose={() => setReceiptOrder(null)}
        />
      )}
    </div>
  );
}
