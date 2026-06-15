'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronDown, Coins, Copy, ExternalLink, FileText, Receipt } from 'lucide-react';
import { fmzCn } from '../../../lib/fmz-classnames';
import { ADMIN_STATUS_BADGE, ADMIN_STATUS_BORDER, STATUS_LABEL_PT } from '../domain';
import type {
  FmzAdminTokenOrder,
  FmzTokenOrderTimelineEvent,
  FmzTokenOrderTimelineEventType,
} from '../domain';

// ─── Timeline event icon ─────────────────────────────────────────────────────

const TIMELINE_ICON: Record<FmzTokenOrderTimelineEventType, ReactNode> = {
  info:  <span className="w-2 h-2 rounded-full bg-[#6B9FD4] inline-block" />,
  ok:    <span className="w-2 h-2 rounded-full bg-[#1A8C5B] inline-block" />,
  error: <span className="w-2 h-2 rounded-full bg-[#D94035] inline-block" />,
  warn:  <span className="w-2 h-2 rounded-full bg-[#F5A623] inline-block" />,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBrl(value: string | number): string {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', {
    day:    '2-digit',
    month:  '2-digit',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  });
}

function truncateId(id: string): string {
  return `${id.slice(0, 8)}…`;
}

const PAYMENT_METHOD_PT: Record<string, string> = {
  pix:          'PIX',
  boleto:       'Boleto',
  card:         'Cartão',
  bank_transfer:'Transferência',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function TimelineEventRow({ event }: { event: FmzTokenOrderTimelineEvent }) {
  return (
    <div className="flex gap-3 items-start">
      <div className="flex flex-col items-center mt-1 shrink-0">
        {TIMELINE_ICON[event.type]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#1E2A3B]">{event.title}</p>
        {event.description && (
          <p className="text-xs text-[#6B7280] mt-0.5">{event.description}</p>
        )}
        <p className="text-xs text-[#9AA3B0] mt-0.5">{formatDateTime(event.timestamp)}</p>
      </div>
    </div>
  );
}

function DocumentsPanel({
  order,
  onOpenReceipt,
}: {
  order: FmzAdminTokenOrder;
  onOpenReceipt: () => void;
}) {
  const { receipt, nf, boleto } = order.documents;
  const hasAny = receipt || nf || boleto;

  if (!hasAny) return null;

  return (
    <div className="mt-4 pt-4 border-t border-[#E8EAF0]">
      <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-2">Documentos</p>
      <div className="flex flex-col gap-2">
        {receipt && (
          <button
            type="button"
            onClick={onOpenReceipt}
            className="flex items-center gap-2 text-sm text-[#3B5BDB] hover:underline w-fit"
          >
            <Receipt className="w-4 h-4 shrink-0" />
            Ver comprovante
          </button>
        )}
        {nf?.url && (
          <a
            href={nf.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-[#3B5BDB] hover:underline w-fit"
          >
            <FileText className="w-4 h-4 shrink-0" />
            Nota Fiscal{nf.number ? ` #${nf.number}` : ''}
            <ExternalLink className="w-3 h-3 shrink-0" />
          </a>
        )}
        {boleto?.url && (
          <a
            href={boleto.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-[#3B5BDB] hover:underline w-fit"
          >
            <FileText className="w-4 h-4 shrink-0" />
            Boleto PDF
            <ExternalLink className="w-3 h-3 shrink-0" />
          </a>
        )}
      </div>
    </div>
  );
}

function RightPanel({
  order,
  onOpenReceipt,
}: {
  order: FmzAdminTokenOrder;
  onOpenReceipt: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    void navigator.clipboard.writeText(order.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* ID */}
      <div>
        <p className="text-xs text-[#9AA3B0] mb-0.5">ID da ordem</p>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-sm font-mono text-[#1E2A3B] hover:text-[#3B5BDB] transition-colors"
          title={order.id}
        >
          {truncateId(order.id)}
          <Copy className="w-3.5 h-3.5 shrink-0" />
          {copied && <span className="text-xs text-[#1A8C5B]">Copiado!</span>}
        </button>
      </div>

      {/* Status */}
      <div>
        <p className="text-xs text-[#9AA3B0] mb-0.5">Status</p>
        <span className={fmzCn('text-xs font-medium px-2 py-0.5 rounded-full', ADMIN_STATUS_BADGE[order.adminStatus])}>
          {STATUS_LABEL_PT[order.status] ?? order.status}
        </span>
      </div>

      {/* Comprador */}
      <div>
        <p className="text-xs text-[#9AA3B0] mb-0.5">Comprador</p>
        <p className="text-sm font-medium text-[#1E2A3B]">{order.buyer.name ?? '—'}</p>
        {order.buyer.email && (
          <p className="text-xs text-[#6B7280]">{order.buyer.email}</p>
        )}
      </div>

      {/* Imóvel */}
      <div>
        <p className="text-xs text-[#9AA3B0] mb-0.5">Imóvel</p>
        <p className="text-sm text-[#1E2A3B]">{order.property.address ?? '—'}</p>
        {order.property.neighborhood && (
          <p className="text-xs text-[#6B7280]">{order.property.neighborhood}</p>
        )}
      </div>

      {/* Tokens */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-xs text-[#9AA3B0] mb-0.5">Tokens</p>
          <p className="text-sm font-medium text-[#1E2A3B]">{order.tokens.quantity}</p>
        </div>
        <div>
          <p className="text-xs text-[#9AA3B0] mb-0.5">Preço/token</p>
          <p className="text-sm text-[#1E2A3B]">{formatBrl(order.tokens.unitPrice)}</p>
        </div>
      </div>

      {/* Total */}
      <div>
        <p className="text-xs text-[#9AA3B0] mb-0.5">Total</p>
        <p className="text-base font-semibold text-[#1E2A3B]">{formatBrl(order.grossAmount)}</p>
      </div>

      {/* Data */}
      <div>
        <p className="text-xs text-[#9AA3B0] mb-0.5">Data</p>
        <p className="text-sm text-[#1E2A3B]">{formatDateTime(order.createdAt)}</p>
      </div>

      <DocumentsPanel order={order} onOpenReceipt={onOpenReceipt} />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type Props = {
  order: FmzAdminTokenOrder;
  isExpanded: boolean;
  timeline: FmzTokenOrderTimelineEvent[];
  timelineLoading: boolean;
  onExpand: () => void;
  onCollapse: () => void;
  onOpenReceipt: (order: FmzAdminTokenOrder) => void;
};

export function FmzAdminTokenOrderRow({
  order,
  isExpanded,
  timeline,
  timelineLoading,
  onExpand,
  onCollapse,
  onOpenReceipt,
}: Props) {
  const handleToggle = () => {
    if (isExpanded) onCollapse();
    else onExpand();
  };

  return (
    <div
      className={fmzCn(
        'bg-white rounded-lg border border-[#E8EAF0] border-l-4 overflow-hidden',
        ADMIN_STATUS_BORDER[order.adminStatus],
      )}
    >
      {/* ── Collapsed row ────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={handleToggle}
        className="w-full text-left px-4 py-3 flex items-center gap-3"
      >
        {/* Status badge */}
        <span
          className={fmzCn(
            'text-xs font-medium px-2 py-0.5 rounded-full shrink-0',
            ADMIN_STATUS_BADGE[order.adminStatus],
          )}
        >
          {STATUS_LABEL_PT[order.status] ?? order.status}
        </span>

        {/* Buyer */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-7 h-7 rounded-full bg-[#E8EAF0] flex items-center justify-center text-xs font-medium text-[#6B7280] shrink-0">
            {order.buyer.initials}
          </span>
          <span className="text-sm font-medium text-[#1E2A3B] truncate">
            {order.buyer.name ?? order.buyer.email ?? '—'}
          </span>
        </div>

        {/* ID */}
        <span className="text-xs font-mono text-[#9AA3B0] shrink-0 hidden lg:inline">
          {truncateId(order.id)}
        </span>

        {/* Property */}
        <span className="text-sm text-[#6B7280] truncate flex-1 hidden md:inline">
          {order.property.address ?? '—'}
        </span>

        {/* Tokens */}
        <span className="flex items-center gap-1 text-sm text-[#6B7280] shrink-0">
          <Coins className="w-4 h-4 shrink-0" />
          {order.tokens.quantity}
        </span>

        {/* Method */}
        {order.paymentMethod && (
          <span className="text-xs text-[#9AA3B0] shrink-0 hidden sm:inline">
            {PAYMENT_METHOD_PT[order.paymentMethod] ?? order.paymentMethod}
          </span>
        )}

        {/* Amount */}
        <span className="text-sm font-semibold text-[#1E2A3B] shrink-0">
          {formatBrl(order.grossAmount)}
        </span>

        {/* Date */}
        <span className="text-xs text-[#9AA3B0] shrink-0 hidden xl:inline">
          {formatDateTime(order.createdAt)}
        </span>

        {/* Chevron */}
        <ChevronDown
          className={fmzCn(
            'w-4 h-4 text-[#9AA3B0] shrink-0 transition-transform duration-200',
            isExpanded && 'rotate-180',
          )}
        />
      </button>

      {/* ── Expanded panel ────────────────────────────────────────────────── */}
      {isExpanded && (
        <div className="border-t border-[#E8EAF0] px-4 py-4 grid grid-cols-1 md:grid-cols-[1fr_280px] gap-6">
          {/* Left: timeline */}
          <div>
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-3">
              Linha do tempo
            </p>
            {timelineLoading && timeline.length === 0 ? (
              <p className="text-sm text-[#9AA3B0]">Carregando eventos…</p>
            ) : (
              <div className="flex flex-col gap-4">
                {timeline.map((event) => (
                  <TimelineEventRow key={event.id} event={event} />
                ))}
                {timeline.length === 0 && (
                  <p className="text-sm text-[#9AA3B0]">Nenhum evento registrado.</p>
                )}
              </div>
            )}
          </div>

          {/* Right: details + documents */}
          <div className="border-t md:border-t-0 md:border-l border-[#E8EAF0] md:pl-6 pt-4 md:pt-0">
            <RightPanel order={order} onOpenReceipt={() => onOpenReceipt(order)} />
          </div>
        </div>
      )}
    </div>
  );
}
