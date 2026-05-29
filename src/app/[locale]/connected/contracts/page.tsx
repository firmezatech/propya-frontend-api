import { redirect } from 'next/navigation';

// The admin contract management page moved to /connected/contracts-management.
// Backend-configured pages that still reference the old path are redirected here.
export default function AdminContractsRedirectPage() {
  redirect('/connected/contracts-management');
}
