import { Suspense } from 'react';
import { FmzTenantContractModule } from '../../../../features/tenant-portal/components';
import { FmzContractSkeleton, FmzTenantPageSkeletonFrame } from '../../../../components/layout';

export default function MyContractPage() {
  return (
    <Suspense
      fallback={
        <FmzTenantPageSkeletonFrame>
          <FmzContractSkeleton />
        </FmzTenantPageSkeletonFrame>
      }
    >
      <FmzTenantContractModule />
    </Suspense>
  );
}
