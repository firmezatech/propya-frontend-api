'use client';

// Redirects a tenant to the "Tokens Adquiridos" celebration whenever an unacknowledged one is
// pending — on every page navigation, covering both "first page after login" and "redirect while
// already logged in" (e.g. tokens settle while the tenant is browsing another page).
// Mounted only inside the tenant layout branch (celebrations are tenant-only). Renders nothing.

import { useEffect } from 'react';
import { usePathname, useRouter } from '../../i18n/navigation';
import { getPendingTokenAcquisitionCelebration } from '../../features/tenant-portal/token-acquisition/services/fmz-token-acquisition-api';

const CELEBRATION_PATH = '/connected/tokens-acquired';

export function FmzCelebrationRedirectGate() {
  const router = useRouter();
  const pathname = usePathname(); // next-intl pathname is locale-stripped, e.g. /connected/dashboard

  useEffect(() => {
    // Skip from the celebration page itself — avoids looping while the tenant hasn't clicked "Continue" yet.
    if (pathname?.startsWith(CELEBRATION_PATH)) return;

    let cancelled = false;
    getPendingTokenAcquisitionCelebration()
      .then((pending) => {
        if (!cancelled && pending) router.replace(CELEBRATION_PATH);
      })
      .catch(() => {
        // Best-effort: a failed check must never block the page the tenant is on.
      });
    return () => { cancelled = true; };
  }, [pathname, router]);

  return null;
}
