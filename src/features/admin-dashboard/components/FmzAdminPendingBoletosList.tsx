'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  listAdminRentCharges,
} from '../../admin-rent-charges/services/fmz-admin-rent-charges-api';
import type { FmzAdminRentCharge } from '../../admin-rent-charges/domain/fmz-admin-rent-charges.types';
import styles from './FmzAdminDashboard.module.css';

const PREVIEW_LIMIT = 4;

const getCurrentCompetenceMonth = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
};

const formatBrl = (value: string): string => {
  const amount = parseFloat(value);
  if (!Number.isFinite(amount)) return 'R$ 0,00';
  return amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatDueDate = (isoDate: string): string => {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

const AVATAR_COLORS = ['#3B5EA6', '#3BA66B', '#D94F3D', '#1A8C5B', '#7C3AED', '#C8A020'];

const avatarColorFor = (initials: string): string =>
  AVATAR_COLORS[initials.charCodeAt(0) % AVATAR_COLORS.length];

const isOverdue = (isoDate: string): boolean => {
  if (!isoDate) return false;
  return new Date(isoDate).getTime() < Date.now();
};

const ViewIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

type BoletoRowProps = {
  charge:            FmzAdminRentCharge;
  onValidateClick:   (chargeId: string) => void;
};

function BoletoRow({ charge, onValidateClick }: BoletoRowProps) {
  const overdue = isOverdue(charge.dueDate);
  const color = avatarColorFor(charge.tenant.initials);

  return (
    <div className={styles.boletoRow}>
      <div className={styles.boletoAvatar} style={{ background: color }}>
        {charge.tenant.initials}
      </div>
      <div className={styles.boletoBody}>
        <div className={styles.boletoName}>{charge.tenant.name}</div>
        <div className={styles.boletoMeta}>
          <span>{charge.property.address}</span>
          <span className={styles.boletoDot} aria-hidden />
          <span>{overdue ? `venceu ${formatDueDate(charge.dueDate)}` : `vence ${formatDueDate(charge.dueDate)}`}</span>
        </div>
      </div>
      <span className={styles.boletoAmount}>{formatBrl(charge.amounts.gross)}</span>
      <span className={`${styles.boletoStatus} ${overdue ? styles.boletoStatusOverdue : styles.boletoStatusPending}`}>
        {overdue ? '🔴 Vencido' : '⏳ Pendente'}
      </span>
      <button
        type="button"
        className={styles.boletoValidateBtn}
        onClick={() => onValidateClick(charge.id)}
        aria-label={`Validar boleto de ${charge.tenant.name}`}
      >
        <ViewIcon /> Validar
      </button>
    </div>
  );
}

type Props = {
  totalPendingCount: number;
};

export function FmzAdminPendingBoletosList({ totalPendingCount }: Props) {
  const router = useRouter();
  const [charges, setCharges]   = useState<FmzAdminRentCharge[]>([]);
  const [loading, setLoading]   = useState(true);
  const generationRef           = useRef(0);

  const competenceMonth = getCurrentCompetenceMonth();

  const loadCharges = useCallback(async () => {
    const generation = ++generationRef.current;
    setLoading(true);
    try {
      const result = await listAdminRentCharges({ competenceMonth, status: 'pending_validation' });
      if (generation !== generationRef.current) return;
      setCharges(result.charges.slice(0, PREVIEW_LIMIT));
    } catch (err) {
      console.error('[FmzAdminPendingBoletosList] fetch failed:', err);
      if (generation !== generationRef.current) return;
      setCharges([]);
    } finally {
      if (generation === generationRef.current) setLoading(false);
    }
  }, [competenceMonth]);

  useEffect(() => {
    void loadCharges();
  }, [loadCharges]);

  const navigateToValidation = useCallback((chargeId: string) => {
    router.push(`/connected/admin-rent-charges?competenceMonth=${competenceMonth}&chargeId=${chargeId}`);
  }, [router, competenceMonth]);

  const navigateToAll = useCallback(() => {
    router.push(`/connected/admin-rent-charges?competenceMonth=${competenceMonth}&status=pending_validation`);
  }, [router, competenceMonth]);

  if (loading) {
    return (
      <div className={styles.sectionCard}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionTitle}>
            Boletos aguardando validação
            {totalPendingCount > 0 && (
              <span className={styles.sectionBadge}>{totalPendingCount}</span>
            )}
          </span>
        </div>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={styles.boletoRow}>
            <div className={styles.skeleton} style={{ width: 34, height: 34, borderRadius: '50%' }} />
            <div className={styles.boletoBody}>
              <div className={styles.skeleton} style={{ width: '55%', height: 13, borderRadius: 4, marginBottom: 5 }} />
              <div className={styles.skeleton} style={{ width: '70%', height: 11, borderRadius: 4 }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (charges.length === 0) {
    return (
      <div className={styles.sectionCard}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionTitle}>Boletos aguardando validação</span>
        </div>
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--dash-hint)', fontSize: 13 }}>
          Nenhum boleto pendente este mês.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.sectionCard}>
      <div className={styles.sectionHead}>
        <span className={styles.sectionTitle}>
          Boletos aguardando validação
          {totalPendingCount > 0 && (
            <span className={styles.sectionBadge}>{totalPendingCount}</span>
          )}
        </span>
        <button type="button" className={styles.sectionAction} onClick={navigateToAll}>
          Ver todos <ArrowRightIcon />
        </button>
      </div>
      {charges.map((charge) => (
        <BoletoRow
          key={charge.id}
          charge={charge}
          onValidateClick={navigateToValidation}
        />
      ))}
    </div>
  );
}
