import { Suspense } from 'react';
import { FmzWalletPage } from '../../../../features/tenant-portal/wallet/components/FmzWalletPage';
import { FmzWalletSkeleton, FmzTenantPageSkeletonFrame } from '../../../../components/layout';

export default function TenantWalletPage() {
  return (
    <Suspense
      fallback={
        <FmzTenantPageSkeletonFrame>
          <FmzWalletSkeleton />
        </FmzTenantPageSkeletonFrame>
      }
    >
      <FmzWalletPage />
    </Suspense>
  );
}
