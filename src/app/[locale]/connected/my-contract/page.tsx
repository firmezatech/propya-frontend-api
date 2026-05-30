import { Suspense } from 'react';
import { FmzTenantContractModule } from '../../../../features/tenant-portal/components';
import { FmzContractSkeleton } from '../../../../components/layout';

export default function MyContractPage() {
  return (
    <Suspense fallback={<FmzContractSkeleton />}>
      <FmzTenantContractModule />
    </Suspense>
  );
}
