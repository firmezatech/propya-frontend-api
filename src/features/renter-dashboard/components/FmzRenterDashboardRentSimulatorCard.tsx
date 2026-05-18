'use client';

import { useEffect, useMemo, useState } from 'react';
import type { FmzRenterDashboardViewModel } from '../domain';
import styles from './FmzRenterDashboard.module.css';

type Props = {
  viewModel: FmzRenterDashboardViewModel;
  hasAnimated: boolean;
};

const SLIDER_STEP = 50;

const moneyFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 });
const compactFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const pctFmt = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1, minimumFractionDigits: 0 });

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);
const fmt = (v: number) => moneyFmt.format(Math.max(v, 0));
const fmtCompact = (v: number) => compactFmt.format(Math.max(v, 0));
const fmtPct = (v: number) => `${pctFmt.format(Math.max(v, 0))}%`;
const roundStep = (v: number) => Math.round(v / SLIDER_STEP) * SLIDER_STEP;

function resolveSliderBounds(vm: FmzRenterDashboardViewModel) {
  const propertyValue = Math.max(Math.floor(vm.propertyValueNumber), 0);
  const ownedValue = clamp(roundStep(vm.acquiredTokensNumber), 0, propertyValue);
  return {
    minOwnedValue: ownedValue,
    maxOwnedValue: propertyValue > 0 ? propertyValue : ownedValue + SLIDER_STEP,
  };
}

function calcRentByOwnership(vm: FmzRenterDashboardViewModel, simulatedPct: number): number {
  const currentRent = Math.max(vm.currentRentNumber, 0);
  if (currentRent <= 0) return 0;
  const extra = Math.max(clamp(simulatedPct, vm.ownershipPercentage, 100) - vm.ownershipPercentage, 0);
  return Math.max(currentRent * (1 - extra / 100), 0);
}

export function FmzRenterDashboardRentSimulatorCard({ viewModel, hasAnimated }: Props) {
  const { minOwnedValue, maxOwnedValue } = useMemo(() => resolveSliderBounds(viewModel), [viewModel]);
  const [simValue, setSimValue] = useState(minOwnedValue);

  useEffect(() => { setSimValue(minOwnedValue); }, [minOwnedValue]);

  const ownedValue = clamp(simValue, minOwnedValue, maxOwnedValue);
  const purchaseAmount = Math.max(ownedValue - minOwnedValue, 0);
  const simOwnership = viewModel.propertyValueNumber > 0
    ? clamp((ownedValue / viewModel.propertyValueNumber) * 100, viewModel.ownershipPercentage, 100)
    : viewModel.ownershipPercentage;
  const simRent = calcRentByOwnership(viewModel, simOwnership);
  const rangeProgress = maxOwnedValue > minOwnedValue
    ? ((ownedValue - minOwnedValue) / (maxOwnedValue - minOwnedValue)) * 100
    : 0;

  return (
    <div className={`${styles.card} ${styles.simCard}`}>

      <div className={styles.simL}>
        <div className={styles.simEyebrow}>
          <span className={styles.upIco}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="18 15 12 9 6 15" />
            </svg>
          </span>
          Seu aluguel caiu
        </div>
        <div className={styles.simCompare}>
          <span className={styles.simCurrent}>{viewModel.currentRentLabel}</span>
          <span className={styles.simOriginal}>{viewModel.originalRentLabel}</span>
        </div>
        <p className={styles.simCopy}>{viewModel.rentCopy}</p>
        <span className={styles.savingsPill}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {viewModel.yearlySavingsLabel}/ano economizados
        </span>
      </div>

      <div className={styles.simR}>
        <div className={styles.simRHead}>
          <span>Simule comprar mais</span>
          <span className={styles.simAmt}>{fmtCompact(purchaseAmount)}</span>
        </div>

        <input
          type="range"
          min={minOwnedValue}
          max={maxOwnedValue}
          step={SLIDER_STEP}
          value={ownedValue}
          onChange={(e) => setSimValue(Number(e.target.value))}
          className={styles.simSlider}
          style={{ ['--sim-progress' as string]: hasAnimated ? `${rangeProgress}%` : '0%' }}
          aria-label="Total de tokens após a compra simulada"
        />
        <div className={styles.simRangeLabels}>
          <span>{fmtCompact(minOwnedValue)}</span>
          <span>{fmtCompact(maxOwnedValue)}</span>
        </div>

        <div className={styles.simResult}>
          <div className={styles.simResultK}>Seu novo aluguel</div>
          <div className={styles.simResultRow}>
            <span className={styles.simResultV}>{fmt(simRent)}</span>
            <span className={styles.simResultStrike}>{viewModel.originalRentLabel}</span>
          </div>
        </div>

        <div className={styles.simPills}>
          <div className={styles.simPill}>
            <div className={styles.simPillK}>Tokens</div>
            <div className={styles.simPillV}>+{fmtCompact(purchaseAmount)}</div>
          </div>
          <div className={styles.simPill}>
            <div className={styles.simPillK}>Posse atual</div>
            <div className={styles.simPillV}>{viewModel.ownershipPercentageLabel}</div>
          </div>
          <div className={styles.simPill}>
            <div className={styles.simPillK}>Posse nova</div>
            <div className={`${styles.simPillV} ${styles.simPillVGreen}`}>{fmtPct(simOwnership)}</div>
          </div>
        </div>
      </div>

    </div>
  );
}
