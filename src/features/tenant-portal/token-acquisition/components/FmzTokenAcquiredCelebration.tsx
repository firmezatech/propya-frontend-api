'use client';

// "Tokens Adquiridos" celebration — shown once after a voluntary token purchase settles.
// Purely presentational: it renders the backend-provided celebration payload and never derives
// any money/ownership number itself. Data + acknowledge live in the hook/page.

import { ArrowDownRight, ArrowUpRight, Coins, Home, PiggyBank, TrendingUp } from 'lucide-react';
import type { TokenAcquisitionCelebration } from '../domain/fmz-token-acquisition.types';

const brl = (currency: string) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: currency || 'BRL' });
const int = new Intl.NumberFormat('pt-BR');
const pct = (value: number) => `${int.format(Number.isInteger(value) ? value : Number(value.toFixed(2)))}%`;
const pp = (value: number) => `${value > 0 ? '+' : ''}${Number(value.toFixed(1)).toLocaleString('pt-BR')} pp`;

type StatCardProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
  delta: string;
  deltaPositive: boolean;
  caption: string;
};

function StatCard({ icon, label, value, delta, deltaPositive, caption }: StatCardProps) {
  return (
    <div className="rounded-[14px] border border-fmz-border-light bg-white p-4 shadow-[0_2px_6px_rgba(14,22,38,0.04)]">
      <div className="mb-2 flex items-center gap-2 text-fmz-text-muted">
        <span className="grid h-7 w-7 place-items-center rounded-[9px] bg-fmz-page text-fmz-navy">{icon}</span>
        <span className="text-[12.5px] font-medium">{label}</span>
      </div>
      <div className="text-[22px] font-bold tracking-[-0.01em] text-fmz-navy">{value}</div>
      <div
        className={`mt-1 inline-flex items-center gap-1 text-[12.5px] font-semibold ${
          deltaPositive ? 'text-[#127A4F]' : 'text-[#1F5BD6]'
        }`}
      >
        {deltaPositive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
        {delta}
      </div>
      <div className="mt-1 text-[11.5px] text-fmz-text-hint">{caption}</div>
    </div>
  );
}

export function FmzTokenAcquiredCelebration({
  celebration,
  onContinue,
}: {
  celebration: TokenAcquisitionCelebration;
  onContinue: () => void;
}) {
  const money = brl(celebration.property.currency);
  const propertyLabel = celebration.property.label ?? 'seu imóvel';
  const goal = celebration.nextGoal;

  return (
    <div className="mx-auto w-full max-w-[640px] px-4 py-8">
      {/* Hero */}
      <div className="rounded-[18px] border border-fmz-border-light bg-gradient-to-b from-white to-fmz-page p-6 text-center shadow-[0_18px_48px_-18px_rgba(14,22,38,0.18)]">
        <span className="inline-flex items-center gap-2 rounded-full bg-[#E8F5EE] px-3 py-1 text-[12px] font-semibold text-[#127A4F]">
          Aquisição concluída · pagamento confirmado
        </span>
        <h1 className="mt-4 text-[26px] font-bold leading-tight tracking-[-0.02em] text-fmz-navy">
          Você está mais perto do seu lar.
        </h1>
        <div className="mt-4 inline-flex items-center gap-2 rounded-[14px] bg-fmz-navy px-4 py-3 text-white">
          <Coins className="h-5 w-5 text-fmz-gold" />
          <span className="text-[22px] font-bold tracking-[-0.01em]">{int.format(celebration.tokensAcquired)} tokens</span>
        </div>
        <p className="mx-auto mt-4 max-w-[460px] text-[13.5px] leading-relaxed text-fmz-text-muted">
          foram creditados na sua carteira do <strong className="text-fmz-navy">{propertyLabel}</strong>. Cada token é
          um pedaço seu — e um aluguel a menos no seu mês.
        </p>
      </div>

      {/* Stat cards */}
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          icon={<TrendingUp className="h-[15px] w-[15px]" />}
          label="Sua posse"
          value={pct(celebration.ownership.newPercentage)}
          delta={pp(celebration.ownership.deltaPercentagePoints)}
          deltaPositive
          caption={`do ${propertyLabel}`}
        />
        <StatCard
          icon={<PiggyBank className="h-[15px] w-[15px]" />}
          label="Aluguel mensal"
          value={money.format(celebration.rent.newRentAmount)}
          delta={`−${money.format(celebration.rent.monthlySavingsAmount)}`}
          deltaPositive={false}
          caption="economia mensal"
        />
        <StatCard
          icon={<Home className="h-[15px] w-[15px]" />}
          label="Patrimônio imobiliário"
          value={money.format(celebration.equity.newValue)}
          delta={`+${money.format(celebration.equity.deltaValue)}`}
          deltaPositive
          caption="do imóvel"
        />
      </div>

      {/* Goal progress */}
      {goal ? (
        <div className="mt-5 rounded-[16px] border border-fmz-border-light bg-white p-5 shadow-[0_2px_6px_rgba(14,22,38,0.04)]">
          <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-fmz-navy">Caminho até a casa própria</h2>
          <p className="mt-1 text-[13px] leading-relaxed text-fmz-text-muted">
            Sua próxima meta é <strong className="text-fmz-navy">{pct(goal.targetPercentage)} de posse</strong>.
            {goal.projectedRentAtGoal != null
              ? ` Ao atingir, seu aluguel cai para ${money.format(goal.projectedRentAtGoal)}.`
              : ''}
          </p>

          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between text-[12px] font-medium text-fmz-text-muted">
              <span>Hoje: {pct(goal.currentOwnershipPercentage)}</span>
              <span>Meta: {pct(goal.targetPercentage)} · faltam {int.format(goal.tokensRemaining)} tokens</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-fmz-page">
              <div
                className="h-full rounded-full bg-fmz-gold transition-[width] duration-700"
                style={{ width: `${Math.min(Math.max(goal.progressPercentage, 0), 100)}%` }}
              />
            </div>
          </div>
        </div>
      ) : null}

      {/* CTA */}
      <button
        type="button"
        onClick={onContinue}
        className="mt-6 w-full rounded-[12px] bg-fmz-navy px-5 py-3.5 text-[14px] font-semibold text-white transition hover:-translate-y-0.5"
      >
        Continuar
      </button>
    </div>
  );
}
