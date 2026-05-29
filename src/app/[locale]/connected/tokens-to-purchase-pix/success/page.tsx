import { Suspense } from 'react';
import { FmzTenantTokenPurchaseSuccessPage } from '../../../../../features/tenant-portal/token-purchase/components/FmzTenantTokenPurchasePages';
import { FmzPageLoadingShell } from '../../../../../components/layout/FmzPageLoadingShell';

export default function TokenPurchaseSuccessPage() {
  return (
    <Suspense fallback={<FmzPageLoadingShell />}>
      <FmzTenantTokenPurchaseSuccessPage />
    </Suspense>
  );
}
