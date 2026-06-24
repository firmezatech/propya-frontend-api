'use client';

// ─── FmzPermissionDeniedCard ──────────────────────────────────────────────────
// Visual port of references/"Sem Permissão.html" into the design system used by
// FmzVerifyEmailRequiredCard (rounded card, accent bar, icon circle, gold/ghost actions).
//
// Rendered by FmzRouteAccessGuard when an authenticated principal has zero
// accessiblePages to fall back to — the frontend mirror of the backend's
// PERMISSION_FORBIDDEN / ROUTE_PERMISSION_FORBIDDEN gate (TAG-6, propya-backend-api).

import { useRouter, useParams } from 'next/navigation';
import { Home, LogOut, ShieldX } from 'lucide-react';
import { fmzPublicLayoutConfig } from '../../../config/fmz-public-layout-config';
import { buildFmzLocalizedPublicPath, performFirmezaLogout } from '../../../services/auth/fmz-logout';

export function FmzPermissionDeniedCard() {
  const router = useRouter();
  const params = useParams<{ locale?: string }>();

  const goHome = () => router.replace(buildFmzLocalizedPublicPath(params?.locale, fmzPublicLayoutConfig.homePath));
  const logout = () => performFirmezaLogout({ router, locale: params?.locale });

  return (
    <section className="w-full max-w-[480px]" aria-labelledby="fmz-permission-denied-title">
      <div className="overflow-hidden rounded-[22px] border-[1.5px] border-fmz-border-light bg-white shadow-[0_4px_12px_rgba(14,22,38,.06),0_20px_48px_-12px_rgba(14,22,38,.14)]">

        {/* Accent bar */}
        <div className="h-[5px] bg-gradient-to-r from-[#2A1A22] via-fmz-error to-[#2A1A22]" />

        <div
          className="flex flex-col items-center px-[clamp(28px,5vw,44px)] pb-[clamp(32px,4vw,44px)] pt-[clamp(32px,5vw,48px)] text-center"
          role="alert"
          aria-live="assertive"
        >
          <span className="mb-6 inline-flex items-center gap-[7px] rounded-full border border-fmz-error-border bg-fmz-error-bg px-[13px] py-[6px] text-[11px] font-bold uppercase tracking-[.14em] text-fmz-error">
            <span className="h-1.5 w-1.5 rounded-full bg-fmz-error" aria-hidden="true" />
            Acesso restrito
          </span>

          <div
            className="mb-6 flex h-[88px] w-[88px] items-center justify-center rounded-3xl border border-fmz-border-light bg-fmz-error-bg"
            aria-hidden="true"
          >
            <ShieldX className="h-10 w-10 text-fmz-error" strokeWidth={1.6} />
          </div>

          <h1
            id="fmz-permission-denied-title"
            className="mb-2.5 text-[26px] font-extrabold leading-[1.1] tracking-[-0.03em] text-fmz-navy"
          >
            Você não tem permissão para acessar esta página
          </h1>
          <p className="mb-6 max-w-[360px] text-[14px] leading-[1.6] text-fmz-text-muted [text-wrap:pretty]">
            Seu perfil atual não autoriza a visualização deste conteúdo. Se você acredita que isso é um
            engano, entre em contato com o administrador da plataforma.
          </p>

          <div className="my-1 h-px w-full bg-fmz-border-light" aria-hidden="true" />

          <div className="mt-6 flex w-full flex-wrap justify-center gap-[11px]">
            <button
              type="button"
              onClick={goHome}
              className="inline-flex items-center justify-center gap-2 rounded-[11px] border-[1.5px] border-fmz-gold bg-fmz-gold px-[22px] py-[13px] text-[14px] font-semibold text-fmz-navy transition hover:-translate-y-px hover:border-fmz-gold-dark hover:bg-fmz-gold-dark"
            >
              <Home aria-hidden="true" className="h-4 w-4" />
              Ir para o início
            </button>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center justify-center gap-2 rounded-[11px] border-[1.5px] border-fmz-border-light bg-white px-[22px] py-[13px] text-[14px] font-semibold text-fmz-navy transition hover:-translate-y-px hover:border-fmz-navy"
            >
              <LogOut aria-hidden="true" className="h-4 w-4" />
              Sair da conta
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
