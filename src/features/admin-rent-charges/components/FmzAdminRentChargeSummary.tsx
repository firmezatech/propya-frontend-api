'use client';

import type { ReactNode } from 'react';
import { CheckCircle2, Clock, CreditCard } from 'lucide-react';
import type { FmzRentChargeSummary } from '../domain';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const brlFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

function parseBrl(value: string): number {
  if (!value || typeof value !== 'string') return 0;
  const normalized = value.includes(',')
    ? value.replace(/\./g, '').replace(',', '.')
    : value;
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
  iconBg: string;
  icon: ReactNode;
};

function SummaryCard({ label, value, iconBg, icon }: SummaryCardProps) {
  return (
    <article className="flex items-center gap-3 rounded-xl border-[1.5px] border-[#E8EAF0] bg-white p-4">
      <div
        className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[9px] ${iconBg}`}
      >
        {icon}
      </div>
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[#9AA3B0]">
          {label}
        </div>
        <div className="font-sans text-[20px] font-extrabold text-[#0D1321]">{value}</div>
      </div>
    </article>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export type FmzAdminRentChargeSummaryProps = {
  summary: FmzRentChargeSummary;
};

/**
 * Strip de 3 cards de resumo do mês: pendentes, concluídas e volume pendente.
 */
export function FmzAdminRentChargeSummary({ summary }: FmzAdminRentChargeSummaryProps) {
  return (
    <div className="mb-7 grid grid-cols-1 gap-3 sm:grid-cols-3">
      <SummaryCard
        label="Aguardando revisão"
        value={String(summary.pendingCount)}
        iconBg="bg-[#FFF9E6]"
        icon={<Clock size={18} className="text-[#C8A020]" />}
      />
      <SummaryCard
        label="Gerados este mês"
        value={String(summary.doneCount)}
        iconBg="bg-[#F0FAF5]"
        icon={<CheckCircle2 size={18} className="text-[#1A8C5B]" />}
      />
      <SummaryCard
        label="Volume total previsto"
        value={formatBrl(summary.totalPendingVolumeBrl)}
        iconBg="bg-[#EFF6FF]"
        icon={<CreditCard size={18} className="text-[#2563EB]" />}
      />
    </div>
  );
}
