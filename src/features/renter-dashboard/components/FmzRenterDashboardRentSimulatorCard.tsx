'use client';

import { useMemo, useState } from 'react';
import type { FmzRenterDashboardViewModel } from '../domain';
import styles from './FmzRenterDashboard.module.css';

type FmzRenterDashboardRentSimulatorCardProps = {
  viewModel: FmzRenterDashboardViewModel;
  hasAnimated: boolean;
};

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
  maximumFractionDigits: 1,
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

function calculateRentReductionPerPercentagePoint(viewModel: FmzRenterDashboardViewModel): number {
  if (viewModel.ownershipPercentage <= 0) {
    return viewModel.originalRentNumber / 100;
  }

  return Math.max(viewModel.originalRentNumber - viewModel.currentRentNumber, 0) / viewModel.ownershipPercentage;
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
    const addedOwnership = Math.max(simulatedOwnership - viewModel.ownershipPercentage, 0);
    const rentReduction = addedOwnership * calculateRentReductionPerPercentagePoint(viewModel);
    return Math.max(viewModel.currentRentNumber - rentReduction, 0);
  }, [simulatedOwnership, viewModel]);

  const annualSavings = Math.max(viewModel.originalRentNumber - simulatedRent, 0) * 12;
  const rentBarPercentage = viewModel.originalRentNumber > 0 ? clamp((simulatedRent / viewModel.originalRentNumber) * 100, 0, 100) : 0;
  const rangeProgress = maxAmount > 0 ? (purchaseAmount / maxAmount) * 100 : 0;

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
          min={0}
          max={maxAmount}
          step={SLIDER_STEP}
          value={purchaseAmount}
          onChange={(event) => setPurchaseAmount(Number(event.target.value))}
          className={styles.simSlider}
          style={{ ['--simulator-progress' as string]: hasAnimated ? `${rangeProgress}%` : '0%' }}
          aria-label="Quantidade de tokens para simulação"
        />
        <div className={styles.simRangeLabels}>
          <span>R$ 0</span>
          <span className={styles.simCurrentAmount}>{formatCompactCurrency(purchaseAmount)}</span>
          <span>{formatCompactCurrency(maxAmount)}</span>
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

        <div className={styles.simSavingsNote}>
          <span>Economia anual estimada</span>
          <strong>{formatCurrency(annualSavings)}/ano</strong>
        </div>
      </div>
    </article>
  );
}
