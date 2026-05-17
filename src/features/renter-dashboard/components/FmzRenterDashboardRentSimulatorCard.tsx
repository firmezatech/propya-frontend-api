'use client';

import { useEffect, useMemo, useState } from 'react';
import type { FmzRenterDashboardViewModel } from '../domain';
import styles from './FmzRenterDashboard.module.css';

type FmzRenterDashboardRentSimulatorCardProps = {
  viewModel: FmzRenterDashboardViewModel;
  hasAnimated: boolean;
};

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
  maximumFractionDigits: 1,
  minimumFractionDigits: 0,
});

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);
const formatCurrency = (value: number): string => currencyFormatter.format(Math.max(value, 0));
const formatCompactCurrency = (value: number): string => compactCurrencyFormatter.format(Math.max(value, 0));
const formatPercentage = (value: number): string => `${percentFormatter.format(Math.max(value, 0))}%`;

function roundToStep(value: number): number {
  return Math.round(value / SLIDER_STEP) * SLIDER_STEP;
}

function resolveSliderBounds(viewModel: FmzRenterDashboardViewModel) {
  const propertyValue = Math.max(Math.floor(viewModel.propertyValueNumber), 0);
  const currentOwnedValue = clamp(roundToStep(viewModel.acquiredTokensNumber), 0, propertyValue);

  return {
    minOwnedValue: currentOwnedValue,
    maxOwnedValue: propertyValue > 0 ? propertyValue : currentOwnedValue + SLIDER_STEP,
  };
}

function calculateRentByOwnership(
  viewModel: FmzRenterDashboardViewModel,
  simulatedOwnershipPercentage: number,
): number {
  const currentRent = Math.max(viewModel.currentRentNumber, 0);

  if (currentRent <= 0) return 0;

  const extraOwnershipPercentage = Math.max(
    clamp(simulatedOwnershipPercentage, viewModel.ownershipPercentage, 100) - viewModel.ownershipPercentage,
    0,
  );

  return Math.max(
    currentRent * (1 - extraOwnershipPercentage / 100),
    0,
  );
}

export function FmzRenterDashboardRentSimulatorCard({ viewModel, hasAnimated }: FmzRenterDashboardRentSimulatorCardProps) {
  const { minOwnedValue, maxOwnedValue } = useMemo(() => resolveSliderBounds(viewModel), [viewModel]);
  const [simulatedOwnedValue, setSimulatedOwnedValue] = useState(minOwnedValue);

  useEffect(() => {
    setSimulatedOwnedValue(minOwnedValue);
  }, [minOwnedValue]);

  const normalizedOwnedValue = clamp(simulatedOwnedValue, minOwnedValue, maxOwnedValue);
  const purchaseAmount = Math.max(normalizedOwnedValue - minOwnedValue, 0);
  const simulatedOwnership = viewModel.propertyValueNumber > 0
    ? clamp((normalizedOwnedValue / viewModel.propertyValueNumber) * 100, viewModel.ownershipPercentage, 100)
    : viewModel.ownershipPercentage;
  const simulatedRent = calculateRentByOwnership(viewModel, simulatedOwnership);
  const rentBarPercentage = viewModel.currentRentNumber > 0
    ? clamp((simulatedRent / viewModel.currentRentNumber) * 100, 0, 100)
    : 0;
  const rangeProgress = maxOwnedValue > minOwnedValue
    ? ((normalizedOwnedValue - minOwnedValue) / (maxOwnedValue - minOwnedValue)) * 100
    : 0;

  return (
    <article className={`${styles.card} ${styles.rentCard}`} aria-label="Simulador de compra de tokens e aluguel">
      <div className={styles.rentLeft}>
        <div className={styles.rentEyebrow}><span className={styles.rentArrow}>↗</span> Seu aluguel caiu</div>
        <div className={styles.rentCompare}>
          <div className={styles.rentCurrent}>{viewModel.currentRentLabel}</div>
          <div className={styles.rentOriginal}>{viewModel.originalRentLabel}</div>
        </div>
        <p className={styles.rentCopy}>{viewModel.rentCopy}</p>
        <div className={styles.savingsPill}>Você economiza {viewModel.yearlySavingsLabel}/ano</div>
      </div>

      <div className={styles.rentRight}>
        <div className={styles.simLabel}>Simule comprar mais tokens</div>

        <input
          type="range"
          min={minOwnedValue}
          max={maxOwnedValue}
          step={SLIDER_STEP}
          value={normalizedOwnedValue}
          onChange={(event) => setSimulatedOwnedValue(Number(event.target.value))}
          className={styles.simSlider}
          style={{ ['--simulator-progress' as string]: hasAnimated ? `${rangeProgress}%` : '0%' }}
          aria-label="Total de tokens após a compra simulada"
        />
        <div className={styles.simRangeLabels}>
          <span>{formatCompactCurrency(minOwnedValue)}</span>
          <span className={styles.simCurrentAmount}>{formatCompactCurrency(normalizedOwnedValue)}</span>
          <span>{formatCompactCurrency(maxOwnedValue)}</span>
        </div>

        <div className={styles.simRentBox}>
          <div className={styles.simRentLabel}>Seu aluguel com essa compra</div>
          <div className={styles.simRentValues}>
            <span className={styles.simRentCurrent}>{formatCurrency(simulatedRent)}</span>
            <span className={styles.simRentOriginal}>{viewModel.originalRentLabel}</span>
          </div>
          <div className={styles.simRentTrack}>
            <div className={styles.simRentFill} style={{ width: `${rentBarPercentage}%` }} />
          </div>
        </div>

        <div className={styles.simPillGrid}>
          <div className={styles.simPill}>
            <p>Compra</p>
            <strong>{formatCompactCurrency(purchaseAmount)}</strong>
          </div>
          <div className={styles.simPill}>
            <p>Posse atual</p>
            <strong>{viewModel.ownershipPercentageLabel}</strong>
          </div>
          <div className={styles.simPill}>
            <p>Posse nova</p>
            <strong className={styles.simPillSuccess}>{formatPercentage(simulatedOwnership)}</strong>
          </div>
        </div>
      </div>
    </article>
  );
}
