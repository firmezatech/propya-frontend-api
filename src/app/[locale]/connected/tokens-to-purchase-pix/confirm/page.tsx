import { Suspense } from 'react';
import { FmzTenantTokenPurchaseConfirmPage } from '../../../../../features/tenant-portal/token-purchase/components/FmzTenantTokenPurchasePages';
import { FmzPageLoadingShell } from '../../../../../components/layout/FmzPageLoadingShell';

export default function ConfirmTokenPurchasePage() {
  return (
    <Suspense fallback={<FmzPageLoadingShell />}>
      <FmzTenantTokenPurchaseConfirmPage />
    </Suspense>
  );
}
