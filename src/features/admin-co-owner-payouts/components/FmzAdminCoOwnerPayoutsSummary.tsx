'use client';

import type { ReactNode } from 'react';
import { Banknote, Clock, ListChecks, TriangleAlert } from 'lucide-react';
import { fmzCn } from '../../../lib/fmz-classnames';
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

type SummaryCardNoteTone = 'default' | 'green' | 'warn';

const NOTE_TONE_CLASS: Record<SummaryCardNoteTone, string> = {
  default: 'text-[#9AA3B0]',
  green: 'text-[#1A8C5B]',
  warn: 'text-[#D97706]',
};

type SummaryCardProps = {
  label: string;
  value: string;
  subtext?: string;
  noteTone?: SummaryCardNoteTone;
  iconBg: string;
  icon: ReactNode;
};

// Layout vertical (ícone no topo, valor grande abaixo) — mockup de referência, D-15.
function SummaryCard({ label, value, subtext, noteTone = 'default', iconBg, icon }: SummaryCardProps) {
  return (
    <article className="rounded-[13px] border-[1.5px] border-[#E8EAF0] bg-white p-4 transition-colors hover:border-[#C8CCD8]">
      <div className={fmzCn('mb-3 flex h-[34px] w-[34px] items-center justify-center rounded-[9px]', iconBg)}>
        {icon}
      </div>
      <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#9AA3B0]">{label}</div>
      <div className="mb-[5px] text-[23px] font-extrabold leading-none tracking-[-0.03em] text-[#0D1321]">{value}</div>
      {subtext && <div className={fmzCn('text-[11.5px]', NOTE_TONE_CLASS[noteTone])}>{subtext}</div>}
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
        subtext={summary.coOwnersAwaitingCount > 0 ? 'em repasses pendentes' : 'nenhum repasse pendente'}
        noteTone="green"
        iconBg="bg-[#EFF6FF]"
        icon={<Banknote size={18} className="text-[#2563EB]" />}
      />
      <SummaryCard
        label="Co-owners aguardando"
        value={String(summary.coOwnersAwaitingCount)}
        subtext="aguardando aprovação"
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
        subtext={summary.belowMinimumCount > 0 ? `${formatBrl(summary.belowMinimumTotalBrl)} acumulado` : 'nenhum saldo retido'}
        noteTone={summary.belowMinimumCount > 0 ? 'warn' : 'default'}
        iconBg="bg-[#F3F4F6]"
        icon={<TriangleAlert size={18} className="text-[#6B7280]" />}
      />
    </div>
  );
}
