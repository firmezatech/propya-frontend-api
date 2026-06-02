'use client';

// Redirects a tenant to the "Tokens Adquiridos" celebration whenever an unacknowledged one is
// pending — covering both "first page after login" and "redirect while already logged in".
// Mounted only inside the tenant layout branch (celebrations are tenant-only). Renders nothing.

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from '../../i18n/navigation';
import { getPendingTokenAcquisitionCelebration } from '../../features/tenant-portal/token-acquisition/services/fmz-token-acquisition-api';

const CELEBRATION_PATH = '/connected/tokens-acquired';

export function FmzCelebrationRedirectGate() {
  const router = useRouter();
  const pathname = usePathname(); // next-intl pathname is locale-stripped, e.g. /connected/dashboard
  const hasChecked = useRef(false);

  useEffect(() => {
    // Check once per mount, and never from the celebration page itself (avoids a redirect loop).
    if (hasChecked.current || pathname?.startsWith(CELEBRATION_PATH)) return;
    hasChecked.current = true;

    getPendingTokenAcquisitionCelebration()
      .then((pending) => {
        if (pending) router.replace(CELEBRATION_PATH);
      })
      .catch(() => {
        // Best-effort: a failed check must never block the page the tenant is on.
      });
  }, [pathname, router]);

  return null;
}
