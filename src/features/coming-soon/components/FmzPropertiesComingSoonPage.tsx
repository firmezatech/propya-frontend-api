'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { LogIn } from 'lucide-react';
import { FmzAuthHeader, FmzPublicFooter } from '../../../components/layout';
import { FmzComingSoonHero } from './FmzComingSoonHero';
import { fmzPublicLayoutConfig } from '../../../config/fmz-public-layout-config';
import { buildFmzLocalizedHref } from '../../access-control/domain/fmz-route-access';
import { hasFirmezaSession } from '../../../services/auth/auth-storage';

/**
 * Public "coming soon" page for the property-listing experience (/imoveis).
 * Reached by visitors who aren't logged in yet — e.g. the "propertiesUrl" link
 * sent in the investor invite e-mail — so it carries its own public auth
 * header/footer, unlike the connected app shell (see /connected/coming-soon).
 *
 * The listing isn't ready, so nobody should land here: a logged-in visitor is
 * sent back to wherever they came from, a logged-out visitor is sent to login.
 * The hero below is a brief fallback shown only for the instant before the
 * redirect effect runs (and as a safety net if it never fires, e.g. JS disabled).
 */
export function FmzPropertiesComingSoonPage() {
  const router = useRouter();
  const params = useParams<{ locale?: string }>();

  useEffect(() => {
    if (hasFirmezaSession()) {
      // `history.length` is unreliable for "is there a previous page?" — Chrome already
      // counts >=2 for a brand-new tab opened straight from an external link. The
      // same-origin referrer is what actually tells us whether `back()` lands somewhere
      // inside the app (mirrors the goBack() heuristic in references/"Sem Permissão.html").
      const cameFromSameOrigin = (() => {
        try {
          return Boolean(document.referrer) && new URL(document.referrer).origin === window.location.origin;
        } catch {
          return false;
        }
      })();

      if (cameFromSameOrigin) {
        router.back();
      } else {
        router.replace(buildFmzLocalizedHref(params?.locale, fmzPublicLayoutConfig.connectedDashboardPath));
      }
      return;
    }

    router.replace(buildFmzLocalizedHref(params?.locale, fmzPublicLayoutConfig.homePath));
  }, [params?.locale, router]);

  return (
    <div className="grid min-h-screen min-h-[100dvh] grid-rows-[auto_minmax(0,1fr)_auto] bg-white text-fmz-text-primary">
      <FmzAuthHeader
        ariaLabel="Navegação da vitrine de imóveis"
        helperText="Já tem uma conta?"
        actionHref="/"
        actionLabel="Entrar"
        actionIcon={<LogIn aria-hidden="true" />}
      />

      <FmzComingSoonHero
        title="Novos imóveis a caminho"
        description={
          <>
            Estamos preparando a vitrine de imóveis tokenizados da Propya. Em breve você poderá explorar
            oportunidades e investir direto pela plataforma — <strong>com tudo pensado para a sua jornada</strong>.
          </>
        }
        homeHref="/"
        homeLabel="Voltar ao início"
        showReloadButton={false}
      />

      <FmzPublicFooter />
    </div>
  );
}
