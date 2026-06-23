'use client';

import { LogIn } from 'lucide-react';
import { FmzAuthHeader, FmzPublicFooter } from '../../../components/layout';
import { FmzComingSoonHero } from './FmzComingSoonHero';

/**
 * Public "coming soon" page for the property-listing experience (/imoveis).
 * Reached by visitors who aren't logged in yet — e.g. the "propertiesUrl" link
 * sent in the investor invite e-mail — so it carries its own public auth
 * header/footer, unlike the connected app shell (see /connected/coming-soon).
 */
export function FmzPropertiesComingSoonPage() {
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
      />

      <FmzPublicFooter />
    </div>
  );
}
