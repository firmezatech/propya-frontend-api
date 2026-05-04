'use client';

import { useEffect, useState } from 'react';
import { fmzPublicLayoutConfig } from '../../config/fmz-public-layout-config';
import { buildFmzConnectedUserInitials, buildFmzConnectedUserSummary } from './connected-user/fmz-connected-user-storage';
import type { FmzConnectedUserSummary } from './connected-user/fmz-connected-user.types';

export function FmzConnectedUserIdentity() {
  const [userSummary, setUserSummary] = useState<FmzConnectedUserSummary>(() => ({
    name: fmzPublicLayoutConfig.defaultConnectedUserName,
    email: fmzPublicLayoutConfig.defaultConnectedUserEmail,
    initials: buildFmzConnectedUserInitials(fmzPublicLayoutConfig.defaultConnectedUserName),
  }));

  useEffect(() => {
    const syncUserSummary = () => setUserSummary(buildFmzConnectedUserSummary());
    syncUserSummary();
    window.addEventListener('storage', syncUserSummary);
    window.addEventListener('walletChanged', syncUserSummary);

    return () => {
      window.removeEventListener('storage', syncUserSummary);
      window.removeEventListener('walletChanged', syncUserSummary);
    };
  }, []);

  return (
    <div className="flex min-w-0 items-center gap-3 rounded-full border-[1.5px] border-fmz-border-light bg-white py-1.5 pl-1.5 pr-3" aria-label="Usuário conectado">
      <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-fmz-navy font-syne text-xs font-bold text-fmz-gold">
        {userSummary.initials}
      </span>
      <span className="hidden min-w-0 flex-col sm:flex">
        <span className="max-w-[160px] truncate text-[13px] font-semibold text-fmz-text-primary">{userSummary.name}</span>
        <span className="max-w-[180px] truncate text-[11px] text-fmz-text-hint">{userSummary.email}</span>
      </span>
    </div>
  );
}
