'use client';

import Link from 'next/link';
import type { FmzTenantPaymentHistoryItem } from '../../../features/tenant-portal/domain';
import styles from './FmzRenterDashboard.module.css';

type FmzRenterDashboardPaymentHistoryCardProps = {
  items: FmzTenantPaymentHistoryItem[];
  maxItems?: number;
};

const paymentDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const statusLabels: Record<string, string> = {
  paid: 'Pago',
  received: 'Pago',
  confirmed: 'Pago',
  pending: 'Em aberto',
  created: 'Em aberto',
  registered: 'Em aberto',
  overdue: 'Vencido',
  expired: 'Expirado',
  canceled: 'Cancelado',
  cancelled: 'Cancelado',
};

function formatDate(value?: string | null): string {
  if (!value) return 'Não informado';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return paymentDateFormatter.format(parsed);
}

function normalizeStatus(status?: string | null): keyof typeof statusLabels | 'unknown' {
  const normalized = String(status ?? '').trim().toLowerCase();
  return (normalized in statusLabels ? normalized : 'unknown') as keyof typeof statusLabels | 'unknown';
}

function getStatusLabel(status?: string | null): string {
  const normalized = normalizeStatus(status);
  return normalized === 'unknown' ? status?.trim() || 'Não informado' : statusLabels[normalized];
}

function getStatusClassName(status?: string | null): string {
  const normalized = normalizeStatus(status);

  if (normalized === 'paid' || normalized === 'received' || normalized === 'confirmed') {
    return styles.historyStatusPaid;
  }

  if (normalized === 'pending' || normalized === 'created' || normalized === 'registered') {
    return styles.historyStatusOpen;
  }

  return styles.historyStatusNeutral;
}

function formatAmount(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

export function FmzRenterDashboardPaymentHistoryCard({ items, maxItems = 3 }: FmzRenterDashboardPaymentHistoryCardProps) {
  const visibleItems = items.slice(0, maxItems);

  return (
    <div className={styles.card}>
      <div className={styles.historyHeader}>
        <div>
          <h3 className={styles.cardTitle}>Histórico</h3>
          <p className={styles.cardSub}>Confira os boletos mais recentes da sua jornada.</p>
        </div>
        <Link href="/connected/paymentHistory" className={styles.historyViewAllButton}>
          Ver tudo
        </Link>
      </div>

      {visibleItems.length === 0 ? (
        <div className={styles.historyEmptyState}>
          Nenhum pagamento encontrado até o momento.
        </div>
      ) : (
        <div className={styles.historyTableWrap}>
          <table className={styles.historyTable}>
            <thead>
              <tr>
                <th>Mês</th>
                <th>Total</th>
                <th>Vencimento</th>
                <th>Status</th>
                <th>Pagamento</th>
              </tr>
            </thead>
            <tbody>
              {visibleItems.map((item) => (
                <tr key={item.id}>
                  <td>{item.reference}</td>
                  <td className={styles.historyAmount}>{formatAmount(item.amount)}</td>
                  <td>{formatDate(item.dueDate)}</td>
                  <td>
                    <span className={`${styles.historyStatusPill} ${getStatusClassName(item.status)}`}>
                      {getStatusLabel(item.status)}
                    </span>
                  </td>
                  <td>{formatDate(item.paidAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
