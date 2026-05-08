'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import type { FmzAccessControlPrincipal } from '../domain';
import { buildFmzLocalizedHref, canAccessFmzPath, resolveFirstAccessibleFmzPath } from '../domain/fmz-route-access';
import { clearFirmezaSession } from '../../../services/auth/auth-storage';

export type FmzRouteAccessGuardProps = {
  children: ReactNode;
  principal: FmzAccessControlPrincipal | null;
  isLoading: boolean;
};

function FmzAccessLoadingState() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center px-6">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-4 border-t-4 border-fmz-navy" />
        <p className="text-sm text-fmz-text-muted">Validando seus acessos...</p>
      </div>
    </main>
  );
}

function FmzAccessDeniedState() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center px-6">
      <div className="max-w-md rounded-2xl border border-fmz-border-light bg-white p-8 text-center shadow-sm">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-fmz-text-hint">Acesso restrito</p>
        <h1 className="mb-3 font-syne text-2xl font-extrabold text-fmz-navy">Esta página não está liberada para sua role.</h1>
        <p className="text-sm leading-6 text-fmz-text-muted">
          O backend não retornou esta rota dentro das páginas permitidas para o seu usuário. Entre em contato com o administrador caso precise desse acesso.
        </p>
      </div>
    </main>
  );
}

export function FmzRouteAccessGuard({ children, principal, isLoading }: FmzRouteAccessGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams<{ locale?: string }>();

  const canAccessCurrentPath = useMemo(() => canAccessFmzPath(principal, pathname), [pathname, principal]);
  const fallbackPath = useMemo(() => resolveFirstAccessibleFmzPath(principal), [principal]);

  useEffect(() => {
    if (isLoading) return;

    if (!principal) {
      clearFirmezaSession();
      router.replace(buildFmzLocalizedHref(params?.locale, '/'));
      return;
    }

    if (canAccessCurrentPath) return;

    if (fallbackPath) {
      router.replace(buildFmzLocalizedHref(params?.locale, fallbackPath));
    }
  }, [canAccessCurrentPath, fallbackPath, isLoading, params?.locale, principal, router]);

  if (isLoading) return <FmzAccessLoadingState />;
  if (!principal) return null;
  if (!canAccessCurrentPath) return fallbackPath ? <FmzAccessLoadingState /> : <FmzAccessDeniedState />;

  return <>{children}</>;
}
