'use client';

import { LogOut } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { fmzPublicLayoutConfig } from '../../../../config/fmz-public-layout-config';
import { performFirmezaLogout } from '../../../../services/auth/fmz-logout';

const readUserName = (): string => {
  if (typeof window === 'undefined') return fmzPublicLayoutConfig.defaultConnectedUserName;
  return localStorage.getItem('name')?.trim() || fmzPublicLayoutConfig.defaultConnectedUserName;
};

export default function ConnectedLogoutPage() {
  const router = useRouter();
  const params = useParams<{ locale?: string }>();
  const [userName, setUserName] = useState(fmzPublicLayoutConfig.defaultConnectedUserName);
  useEffect(() => {
    setUserName(readUserName());
    const redirectTimer = window.setTimeout(() => {
      performFirmezaLogout({ router, locale: params?.locale, refresh: true });
    }, 350);
    return () => window.clearTimeout(redirectTimer);
  }, [params?.locale, router]);

  return (
    <main className="flex min-h-[calc(100vh-132px)] flex-1 flex-col items-center justify-center px-10 py-16 text-center">
      <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-[#F0F1F5]"><LogOut className="h-7 w-7 text-fmz-text-muted" aria-hidden="true" /></div>
      <h1 className="mt-4 font-sans text-[22px] font-extrabold text-fmz-navy">Você saiu da conta</h1>
      <p className="mt-2 text-sm text-fmz-text-muted">Até logo, {userName.split(' ')[0]}! Sua sessão foi encerrada com segurança.</p>
      <button type="button" onClick={() => performFirmezaLogout({ router, locale: params?.locale, refresh: true })} className="mt-6 rounded-[10px] border-0 bg-fmz-gold px-7 py-3 font-sans text-[13px] font-bold uppercase tracking-[0.04em] text-fmz-navy transition hover:bg-fmz-gold-dark">Entrar novamente</button>
    </main>
  );
}
