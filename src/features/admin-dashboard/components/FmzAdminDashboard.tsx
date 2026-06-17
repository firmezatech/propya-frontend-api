'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styles from './FmzAdminDashboard.module.css';
import { useAdminDashboardOverview, useAdminActivityFeed } from '../hooks/fmz-admin-dashboard';
import { FmzAdminDashboardKPIGrid } from './FmzAdminDashboardKPIGrid';
import { FmzAdminAlertBanner } from './FmzAdminAlertBanner';
import { FmzAdminPendingBoletosList } from './FmzAdminPendingBoletosList';
import { FmzAdminActivityFeed } from './FmzAdminActivityFeed';
import { FmzAdminQuickAccessGrid } from './FmzAdminQuickAccessGrid';
import { FmzAdminPropertiesSidebar } from './FmzAdminPropertiesSidebar';

export function FmzAdminDashboard() {
  const router = useRouter();
  const { overview, loading: overviewLoading } = useAdminDashboardOverview();
  const { events, loading: activityLoading }   = useAdminActivityFeed(5);

  const navigateToProperty = useCallback((propertyId: string) => {
    router.push(`/connected/property-management?propertyId=${propertyId}`);
  }, [router]);

  const navigateToAllProperties = useCallback(() => {
    router.push('/connected/property-management');
  }, [router]);

  const pendingBoletos = overview?.metrics.pendingBoletos ?? 0;

  return (
    <div className={styles.root}>
      <div className={styles.fullWidth}>
        <div className={styles.header}>
          <div>
            <div className={styles.headerEyebrow}>Admin</div>
            <div className={styles.headerTitle}>Painel administrativo</div>
            <div className={styles.headerSub}>Aqui está o resumo da plataforma.</div>
          </div>
        </div>
      </div>

      {pendingBoletos > 0 && (
        <div className={styles.fullWidth}>
          <FmzAdminAlertBanner
            pendingCount={pendingBoletos}
            href="/connected/admin-rent-charges"
          />
        </div>
      )}

      <FmzAdminDashboardKPIGrid
        metrics={overview?.metrics ?? null}
        loading={overviewLoading}
      />

      <div className={styles.leftCol}>
        <FmzAdminPendingBoletosList totalPendingCount={pendingBoletos} />
        <FmzAdminActivityFeed events={events} loading={activityLoading} />
      </div>

      <div className={styles.rightCol}>
        <FmzAdminQuickAccessGrid />
        <FmzAdminPropertiesSidebar
          properties={overview?.topProperties ?? []}
          loading={overviewLoading}
          onPropertyClick={navigateToProperty}
          onViewAllClick={navigateToAllProperties}
        />
      </div>
    </div>
  );
}
