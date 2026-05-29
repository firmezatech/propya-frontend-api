import { Suspense } from 'react';
import { FmzTenantTokenPurchasePage } from '../../../../features/tenant-portal/token-purchase/components/FmzTenantTokenPurchasePages';
import { FmzPageLoadingShell } from '../../../../components/layout/FmzPageLoadingShell';

export default function TokensToPurchasePixPage() {
  return (
    <Suspense fallback={<FmzPageLoadingShell />}>
      <FmzTenantTokenPurchasePage />
    </Suspense>
  );
}
