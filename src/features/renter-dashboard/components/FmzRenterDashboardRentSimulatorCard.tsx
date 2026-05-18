'use client';

import { useEffect, useMemo, useState } from 'react';
import type { FmzRenterDashboardViewModel } from '../domain';
import { computeRentSimulation } from '../domain/fmz-rent-simulator';
import styles from './FmzRenterDashboard.module.css';

type Props = {
  viewModel: FmzRenterDashboardViewModel;
  hasAnimated: boolean;
};

const SLIDER_STEP = 50;

const moneyFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 });
const compactFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const tokenFmt = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
const pctFmt = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2, minimumFractionDigits: 0 });

const fmt = (v: number) => moneyFmt.format(Math.max(v, 0));
const fmtCompact = (v: number) => compactFmt.format(Math.max(v, 0));
const fmtTokens = (v: number) => tokenFmt.format(Math.max(Math.floor(v), 0));
const fmtPct = (v: number) => `${pctFmt.format(Math.min(Math.max(v, 0), 100))}%`;

export function FmzRenterDashboardRentSimulatorCard({ viewModel, hasAnimated }: Props) {
  const currentOwnedTokens = Math.max(Math.floor(viewModel.tokenBalance), 0);
  const totalTokens = Math.max(Math.floor(viewModel.totalTokenSupply), 0);

  const isSimulationAvailable = totalTokens > 0;
  const isFullyOwned = isSimulationAvailable && currentOwnedTokens >= totalTokens;
  const maxAdditionalTokens = Math.max(totalTokens - currentOwnedTokens, 0);

  const [additionalTokens, setAdditionalTokens] = useState(0);

  // Reset slider to zero whenever the tenant's ownership changes.
  useEffect(() => { setAdditionalTokens(0); }, [maxAdditionalTokens]);

  const simResult = useMemo(() => computeRentSimulation({
    currentOwnedTokens,
    totalTokens,
    additionalTokens,
    baseRent: viewModel.baseRentForSimulation,
    tokenUnitValue: viewModel.tokenUnitValue,
  }), [currentOwnedTokens, totalTokens, additionalTokens, viewModel.baseRentForSimulation, viewModel.tokenUnitValue]);

  const rangeProgress = maxAdditionalTokens > 0
    ? (additionalTokens / maxAdditionalTokens) * 100
    : 0;

  const hasTokenPrice = viewModel.tokenUnitValue > 0;
  const maxRangeLabel = hasTokenPrice
    ? fmtCompact(maxAdditionalTokens * viewModel.tokenUnitValue)
    : `${fmtTokens(maxAdditionalTokens)} tokens`;
  const purchaseLabel = additionalTokens > 0
    ? (hasTokenPrice ? fmtCompact(simResult.purchaseCost) : `+${fmtTokens(additionalTokens)} tokens`)
    : '—';

  const displayedNewRent = isSimulationAvailable
    ? fmt(simResult.newRentAmount)
    : viewModel.currentRentLabel;

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
          <span className={styles.simAmt}>{purchaseLabel}</span>
        </div>

        {isSimulationAvailable && !isFullyOwned ? (
          <>
            <input
              type="range"
              min={0}
              max={maxAdditionalTokens}
              step={SLIDER_STEP}
              value={additionalTokens}
              onChange={(e) => setAdditionalTokens(Number(e.target.value))}
              className={styles.simSlider}
              style={{ ['--sim-progress' as string]: hasAnimated ? `${rangeProgress}%` : '0%' }}
              aria-label="Tokens adicionais para compra simulada"
            />
            <div className={styles.simRangeLabels}>
              <span>R$ 0</span>
              <span>{maxRangeLabel}</span>
            </div>
          </>
        ) : (
          <div className={styles.simSliderDisabled}>
            {isFullyOwned ? '100% do imóvel conquistado' : 'Simulação indisponível'}
          </div>
        )}

        <div className={styles.simResult}>
          <div className={styles.simResultK}>Seu novo aluguel</div>
          <div className={styles.simResultRow}>
            <span className={styles.simResultV}>{displayedNewRent}</span>
            <span className={styles.simResultStrike}>{viewModel.originalRentLabel}</span>
          </div>
        </div>

        <div className={styles.simPills}>
          <div className={styles.simPill}>
            <div className={styles.simPillK}>Tokens após compra</div>
            <div className={styles.simPillV}>{fmtTokens(simResult.newOwnedTokens)}</div>
            {additionalTokens > 0 && (
              <div className={styles.simPillSub}>+{fmtTokens(additionalTokens)} novos</div>
            )}
          </div>
          <div className={styles.simPill}>
            <div className={styles.simPillK}>Posse atual</div>
            <div className={styles.simPillV}>{viewModel.ownershipPercentageLabel}</div>
          </div>
          <div className={styles.simPill}>
            <div className={styles.simPillK}>Posse nova</div>
            <div className={`${styles.simPillV} ${styles.simPillVGreen}`}>{fmtPct(simResult.newOwnershipPercentage)}</div>
          </div>
        </div>
      </div>

    </div>
  );
}
