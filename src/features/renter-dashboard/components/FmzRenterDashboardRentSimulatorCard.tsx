'use client';

import { useMemo, useState } from 'react';
import type { FmzRenterDashboardViewModel } from '../domain';
import styles from './FmzRenterDashboard.module.css';

type FmzRenterDashboardRentSimulatorCardProps = {
  viewModel: FmzRenterDashboardViewModel;
  hasAnimated: boolean;
};

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);
const formatCurrency = (value: number): string => currencyFormatter.format(Math.max(value, 0));
const formatPercentage = (value: number): string => `${percentFormatter.format(Math.max(value, 0))}%`;

function resolveSimulationMaxAmount(viewModel: FmzRenterDashboardViewModel): number {
  const remainingToOwn = Math.ceil(viewModel.remainingToOwnNumber);
  const nextMilestoneAmount = Math.ceil(viewModel.nextMilestoneRemainingNumber);
  const baseline = Math.max(nextMilestoneAmount, 1000);
  return Math.max(100, Math.min(remainingToOwn || 1000, baseline));
}

function resolveSliderStep(maxAmount: number): number {
  if (maxAmount <= 1000) return 50;
  if (maxAmount <= 5000) return 100;
  return 250;
}

export function FmzRenterDashboardRentSimulatorCard({ viewModel, hasAnimated }: FmzRenterDashboardRentSimulatorCardProps) {
  const maxAmount = useMemo(() => resolveSimulationMaxAmount(viewModel), [viewModel]);
  const sliderStep = useMemo(() => resolveSliderStep(maxAmount), [maxAmount]);
  const [purchaseAmount, setPurchaseAmount] = useState(Math.min(sliderStep * 2, maxAmount));

  const simulatedOwnership = useMemo(() => {
    if (viewModel.propertyValueNumber <= 0) return viewModel.ownershipPercentage;
    const nextOwnership = viewModel.ownershipPercentage + (purchaseAmount / viewModel.propertyValueNumber) * 100;
    return clamp(nextOwnership, viewModel.ownershipPercentage, 100);
  }, [purchaseAmount, viewModel]);

  const simulatedRent = useMemo(() => {
    const nextRent = viewModel.originalRentNumber * (1 - simulatedOwnership / 100);
    return Math.max(nextRent, 0);
  }, [simulatedOwnership, viewModel.originalRentNumber]);

  const currentDiscount = viewModel.originalRentNumber - viewModel.currentRentNumber;
  const simulatedDiscount = viewModel.originalRentNumber - simulatedRent;
  const additionalDiscount = Math.max(simulatedDiscount - currentDiscount, 0);
  const rangeProgress = maxAmount > 0 ? (purchaseAmount / maxAmount) * 100 : 0;

  return (
    <div className={`${styles.card} ${styles.rentCard}`}>
      <div>
        <div className={styles.rentTitle}>↗ Seu aluguel caiu</div>
        <div className={styles.rentCompare}>
          <div className={styles.rentCurrent}>{viewModel.currentRentLabel}</div>
          <div className={styles.rentOriginal}>{viewModel.originalRentLabel}</div>
        </div>
        <p className={styles.rentCopy}>{viewModel.rentCopy}</p>
        <div className={styles.savingsPill}>Você economiza {viewModel.yearlySavingsLabel}/ano</div>
      </div>

      <div className={styles.simulatorPanel}>
        <div className={styles.simulatorHeader}>
          <h4 className={styles.simulatorTitle}>Simule comprar mais tokens</h4>
          <p className={styles.simulatorSub}>Ajuste a barra para ver como sua posse pode aumentar e como o aluguel estimado pode cair.</p>
        </div>

        <div className={styles.simulatorMetricGrid}>
          <div className={styles.simulatorMetricCard}>
            <span className={styles.simulatorMetricLabel}>Compra simulada</span>
            <strong className={styles.simulatorMetricValue}>{formatCurrency(purchaseAmount)}</strong>
          </div>
          <div className={styles.simulatorMetricCard}>
            <span className={styles.simulatorMetricLabel}>Posse simulada</span>
            <strong className={styles.simulatorMetricValue}>{formatPercentage(simulatedOwnership)}</strong>
          </div>
        </div>

        <div className={styles.simulatorSliderBlock}>
          <input
            type="range"
            min={0}
            max={maxAmount}
            step={sliderStep}
            value={purchaseAmount}
            onChange={(event) => setPurchaseAmount(Number(event.target.value))}
            className={styles.simulatorSlider}
            aria-label="Quantidade de tokens para simulação"
          />
          <div className={styles.simulatorRangeLabels}>
            <span>R$ 0</span>
            <span>{formatCurrency(maxAmount)}</span>
          </div>
          <div className={styles.barTrack}>
            <div className={`${styles.barFill} ${styles.barFillGold}`} style={{ width: hasAnimated ? `${rangeProgress}%` : '0%' }} />
          </div>
        </div>

        <div className={styles.simulatorImpactGrid}>
          <div className={styles.simulatorImpactItem}>
            <span className={styles.simulatorImpactLabel}>Posse atual</span>
            <strong className={styles.simulatorImpactValue}>{viewModel.ownershipPercentageLabel}</strong>
          </div>
          <div className={styles.simulatorImpactItem}>
            <span className={styles.simulatorImpactLabel}>Ganho estimado</span>
            <strong className={styles.simulatorImpactValue}>{formatPercentage(simulatedOwnership - viewModel.ownershipPercentage)}</strong>
          </div>
          <div className={styles.simulatorImpactItem}>
            <span className={styles.simulatorImpactLabel}>Aluguel estimado</span>
            <strong className={styles.simulatorImpactValue}>{formatCurrency(simulatedRent)}</strong>
          </div>
          <div className={styles.simulatorImpactItem}>
            <span className={styles.simulatorImpactLabel}>Desconto extra estimado</span>
            <strong className={`${styles.simulatorImpactValue} ${styles.simulatorImpactValueSuccess}`}>{formatCurrency(additionalDiscount)}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
