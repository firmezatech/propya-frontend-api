import { Suspense } from 'react';
import { FmzInvoicePage } from '../../../../features/tenant-portal/invoices/components/FmzInvoicePage';
import { FmzPageLoadingShell } from '../../../../components/layout/FmzPageLoadingShell';

export default function TenantIssueInvoicePage() {
  return (
    <Suspense fallback={<FmzPageLoadingShell />}>
      <FmzInvoicePage />
    </Suspense>
  );
}
