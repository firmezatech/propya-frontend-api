'use client';

import { useMemo, useState } from 'react';
import type { FmzRenterDashboardViewModel } from '../domain';
import styles from './FmzRenterDashboard.module.css';

type FmzRenterDashboardRentSimulatorCardProps = {
  viewModel: FmzRenterDashboardViewModel;
  hasAnimated: boolean;
};

const TOKEN_UNIT_VALUE = 1;
const MAX_SIMULATION_AMOUNT = 5000;
const SLIDER_STEP = 50;

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 2,
});

const compactCurrencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);
const formatCurrency = (value: number): string => currencyFormatter.format(Math.max(value, 0));
const formatCompactCurrency = (value: number): string => compactCurrencyFormatter.format(Math.max(value, 0));
const formatPercentage = (value: number): string => `${percentFormatter.format(Math.max(value, 0))}%`;

function resolveSimulationMaxAmount(viewModel: FmzRenterDashboardViewModel): number {
  const remainingToOwn = Math.floor(viewModel.remainingToOwnNumber);

  if (remainingToOwn <= 0) return MAX_SIMULATION_AMOUNT;

  return Math.max(SLIDER_STEP, Math.min(remainingToOwn, MAX_SIMULATION_AMOUNT));
}

export function FmzRenterDashboardRentSimulatorCard({ viewModel, hasAnimated }: FmzRenterDashboardRentSimulatorCardProps) {
  const maxAmount = useMemo(() => resolveSimulationMaxAmount(viewModel), [viewModel]);
  const [purchaseAmount, setPurchaseAmount] = useState(0);

  const simulatedOwnership = useMemo(() => {
    if (viewModel.propertyValueNumber <= 0) return viewModel.ownershipPercentage;
    const nextOwnership = viewModel.ownershipPercentage + (purchaseAmount / viewModel.propertyValueNumber) * 100;
    return clamp(nextOwnership, viewModel.ownershipPercentage, 100);
  }, [purchaseAmount, viewModel]);

  const simulatedRent = useMemo(() => {
    const nextRent = viewModel.originalRentNumber * (1 - simulatedOwnership / 100);
    return Math.max(nextRent, 0);
  }, [simulatedOwnership, viewModel.originalRentNumber]);

  const additionalAnnualDiscount = Math.max(viewModel.currentRentNumber - simulatedRent, 0) * 12;
  const rangeProgress = maxAmount > 0 ? (purchaseAmount / maxAmount) * 100 : 0;

  return (
    <article className={styles.simulatorCompactCard} aria-label="Simulador de compra de tokens">
      <p className={styles.simulatorCompactLabel}>Simule comprar mais tokens</p>
      <p className={styles.simulatorCompactHint}>{TOKEN_UNIT_VALUE} token = R$ 1,00 · arraste para simular</p>

      <div className={styles.simulatorCompactGrid}>
        <div className={styles.simulatorCompactMetric}>
          <p className={styles.simulatorCompactMetricLabel}>Compra simulada</p>
          <p className={styles.simulatorCompactMetricValue}>{formatCompactCurrency(purchaseAmount)}</p>
        </div>
        <div className={styles.simulatorCompactMetric}>
          <p className={styles.simulatorCompactMetricLabel}>Posse simulada</p>
          <p className={styles.simulatorCompactMetricValue}>{formatPercentage(simulatedOwnership)}</p>
        </div>
      </div>

      <div className={styles.simulatorCompactSliderWrap}>
        <input
          type="range"
          min={0}
          max={maxAmount}
          step={SLIDER_STEP}
          value={purchaseAmount}
          onChange={(event) => setPurchaseAmount(Number(event.target.value))}
          className={styles.simulatorCompactSlider}
          style={{ ['--simulator-progress' as string]: hasAnimated ? `${rangeProgress}%` : '0%' }}
          aria-label="Quantidade de tokens para simulação"
        />
        <div className={styles.simulatorCompactRangeLabels}>
          <span>R$ 0</span>
          <span>{formatCompactCurrency(maxAmount)}</span>
        </div>
      </div>

      <div className={`${styles.simulatorCompactGrid} ${styles.simulatorCompactDivider}`}>
        <div className={styles.simulatorCompactMetric}>
          <p className={styles.simulatorCompactMetricLabel}>Posse atual</p>
          <p className={styles.simulatorCompactMetricValue}>{viewModel.ownershipPercentageLabel}</p>
        </div>
        <div className={styles.simulatorCompactMetric}>
          <p className={styles.simulatorCompactMetricLabel}>Aluguel estimado</p>
          <p className={styles.simulatorCompactMetricValue}>{formatCurrency(simulatedRent)}</p>
        </div>
      </div>

      <div className={`${styles.simulatorCompactSavings} ${purchaseAmount > 0 ? styles.simulatorCompactSavingsVisible : ''}`}>
        <span className={styles.simulatorCompactSavingsLabel}>
          <svg className={styles.simulatorCompactSavingsIcon} viewBox="0 0 24 24" aria-hidden="true">
            <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
            <polyline points="17 18 23 18 23 12" />
          </svg>
          Seu aluguel caiu
        </span>
        <span className={styles.simulatorCompactSavingsValue}>{formatCurrency(additionalAnnualDiscount)}/ano</span>
      </div>
    </article>
  );
}
