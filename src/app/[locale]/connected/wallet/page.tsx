import { Suspense } from 'react';
import { FmzWalletPage } from '../../../../features/tenant-portal/wallet/components/FmzWalletPage';
import { FmzPageLoadingShell } from '../../../../components/layout/FmzPageLoadingShell';

export default function TenantWalletPage() {
  return (
    <Suspense fallback={<FmzPageLoadingShell />}>
      <FmzWalletPage />
    </Suspense>
  );
}
