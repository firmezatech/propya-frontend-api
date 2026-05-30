import { Suspense } from 'react';
import { FmzWalletPage } from '../../../../features/tenant-portal/wallet/components/FmzWalletPage';
import { FmzWalletSkeleton } from '../../../../components/layout';

export default function TenantWalletPage() {
  return (
    <Suspense fallback={<FmzWalletSkeleton />}>
      <FmzWalletPage />
    </Suspense>
  );
}
