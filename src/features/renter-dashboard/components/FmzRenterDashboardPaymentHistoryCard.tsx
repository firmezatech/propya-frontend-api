'use client';

import Link from 'next/link';
import type { FmzTenantPaymentHistoryItem } from '../../../features/tenant-portal/domain';
import { formatDateBR } from '../../../lib/date-utils';
import styles from './FmzRenterDashboard.module.css';

type Props = {
  items: FmzTenantPaymentHistoryItem[];
  maxItems?: number;
};

const moneyFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 });

const STATUS_LABEL: Record<string, string> = {
  paid: 'Pago', received: 'Pago', confirmed: 'Pago',
  pending: 'Em aberto', created: 'Em aberto', registered: 'Em aberto',
  overdue: 'Vencido', expired: 'Expirado', canceled: 'Cancelado', cancelled: 'Cancelado',
};

function normalizeStatus(status?: string | null): string {
  return String(status ?? '').trim().toLowerCase();
}

function getStatusLabel(status?: string | null): string {
  const k = normalizeStatus(status);
  return STATUS_LABEL[k] ?? status?.trim() ?? 'Não informado';
}

function getHistBadgeClass(status?: string | null): string {
  const k = normalizeStatus(status);
  if (k === 'paid' || k === 'received' || k === 'confirmed') return styles.histBadgePago;
  if (k === 'pending' || k === 'created' || k === 'registered') return styles.histBadgeAberto;
  return styles.histBadgeNeutral;
}

export function FmzRenterDashboardPaymentHistoryCard({ items, maxItems = 4 }: Props) {
  const visible = items.slice(0, maxItems);

  return (
    <div className={styles.card}>
      <div className={styles.cardHead}>
        <div className={styles.cardTitle}>
          <span className={styles.ico}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
          </span>
          Histórico de pagamentos
        </div>
        <Link href="/connected/paymentHistory" className={styles.cardAction}>
          Ver tudo
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
          </svg>
        </Link>
      </div>

      {visible.length === 0 ? (
        <div className={styles.histEmpty}>Nenhum pagamento encontrado.</div>
      ) : (
        <table className={styles.histTable}>
          <thead>
            <tr>
              <th>Competência</th>
              <th>Total</th>
              <th>Vencimento</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((item) => (
              <tr key={item.id}>
                <td className={styles.histMes}>
                  {item.reference}
                </td>
                <td className={styles.histAmount}>{moneyFmt.format(item.amount)}</td>
                <td className={styles.histDate}>{formatDateBR(item.dueDate)}</td>
                <td>
                  <span className={`${styles.histBadge} ${getHistBadgeClass(item.status)}`}>
                    <span className={styles.dot} />{getStatusLabel(item.status)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
