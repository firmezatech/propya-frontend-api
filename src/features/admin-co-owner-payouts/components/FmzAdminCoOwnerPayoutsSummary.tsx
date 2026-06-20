'use client';

import type { ReactNode } from 'react';
import { Banknote, Clock, ListChecks, TriangleAlert } from 'lucide-react';
import type { FmzCoOwnerPayoutsSummary } from '../domain';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const brlFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function parseBrl(value: string): number {
  if (!value || typeof value !== 'string') return 0;
  const normalized = value.includes(',') ? value.replace(/\./g, '').replace(',', '.') : value;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatBrl(value: string): string {
  return brlFormatter.format(parseBrl(value));
}

// ─── Sub-component ────────────────────────────────────────────────────────────

type SummaryCardProps = {
  label: string;
  value: string;
  subtext?: string;
  iconBg: string;
  icon: ReactNode;
};

function SummaryCard({ label, value, subtext, iconBg, icon }: SummaryCardProps) {
  return (
    <article className="flex items-center gap-3 rounded-xl border-[1.5px] border-[#E8EAF0] bg-white p-4">
      <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[9px] ${iconBg}`}>
        {icon}
      </div>
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[#9AA3B0]">
          {label}
        </div>
        <div className="font-sans text-[20px] font-extrabold text-[#0D1321]">{value}</div>
        {subtext && <div className="text-[11px] text-[#9AA3B0]">{subtext}</div>}
      </div>
    </article>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export type FmzAdminCoOwnerPayoutsSummaryProps = {
  summary: FmzCoOwnerPayoutsSummary;
};

/**
 * Strip de 4 cards de resumo do mês de competência (D-7): saldo pendente total,
 * co-owners aguardando, transações abertas e quantidade abaixo do mínimo de payout.
 */
export function FmzAdminCoOwnerPayoutsSummary({ summary }: FmzAdminCoOwnerPayoutsSummaryProps) {
  return (
    <div className="mb-7 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <SummaryCard
        label="Saldo pendente total"
        value={formatBrl(summary.totalPendingBrl)}
        iconBg="bg-[#EFF6FF]"
        icon={<Banknote size={18} className="text-[#2563EB]" />}
      />
      <SummaryCard
        label="Co-owners aguardando"
        value={String(summary.coOwnersAwaitingCount)}
        iconBg="bg-[#FFF9E6]"
        icon={<Clock size={18} className="text-[#C8A020]" />}
      />
      <SummaryCard
        label="Transações abertas"
        value={String(summary.openTransactionsCount)}
        iconBg="bg-[#F0FAF5]"
        icon={<ListChecks size={18} className="text-[#1A8C5B]" />}
      />
      <SummaryCard
        label="Abaixo do mínimo"
        value={String(summary.belowMinimumCount)}
        subtext={summary.belowMinimumCount > 0 ? formatBrl(summary.belowMinimumTotalBrl) : undefined}
        iconBg="bg-[#F3F4F6]"
        icon={<TriangleAlert size={18} className="text-[#6B7280]" />}
      />
    </div>
  );
}
