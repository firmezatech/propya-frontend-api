import { Suspense } from 'react';
import { FmzTenantTokenPurchasePixPage } from '../../../../../features/tenant-portal/token-purchase/components/FmzTenantTokenPurchasePages';
import { FmzPageLoadingShell } from '../../../../../components/layout/FmzPageLoadingShell';

export default function TokenPurchasePixPaymentPage() {
  return (
    <Suspense fallback={<FmzPageLoadingShell />}>
      <FmzTenantTokenPurchasePixPage />
    </Suspense>
  );
}
