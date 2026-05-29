import { Suspense } from 'react';
import { FmzTenantContractModule } from '../../../../features/tenant-portal/components';
import { FmzPageLoadingShell } from '../../../../components/layout/FmzPageLoadingShell';

export default function MyContractPage() {
  return (
    <Suspense fallback={<FmzPageLoadingShell />}>
      <FmzTenantContractModule />
    </Suspense>
  );
}
