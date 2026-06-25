'use client';

import { Clock, MessageCircle } from 'lucide-react';
import { FmzInstagramFeedSection } from '../../../instagram-feed/components/FmzInstagramFeedSection';
import { fmzInstagramFeedConfig } from '../../../instagram-feed/fmz-instagram-feed.config';
import { fmzPublicLayoutConfig } from '../../../../config/fmz-public-layout-config';

const STEPS = [
  { id: 'account', number: '01', title: 'Conta criada', description: 'Cadastro concluído com sucesso.' },
  { id: 'kyc', number: '02', title: 'Identidade verificada', description: 'Sua verificação foi aprovada.' },
  { id: 'contract', number: '03', title: 'Contrato em formalização', description: 'Nossa equipe está vinculando seu imóvel.' },
] as const;

/**
 * Empty state shown on the renter dashboard for a `prospect` whose KYC is
 * approved but who isn't linked to a rental contract yet (TAG-7). Reuses the
 * `.fmz-empty-*` classes from globals.css (same visual language as
 * FmzConnectedEmptyHome) but with tenant-appropriate copy — that shared
 * component's default copy pitches co-owner investing ("invista a partir de
 * R$500"), which is wrong here: a prospect waiting on contract activation has
 * nothing to invest in yet, they're just waiting on the admin.
 */
export function FmzRenterAwaitingPropertyEmptyState() {
  return (
    <div className="fmz-connected-empty-home">
      <section className="fmz-empty-hero" aria-labelledby="fmz-awaiting-property-title">
        <div className="fmz-empty-hero-shell">
          <div className="fmz-empty-orb" aria-hidden="true">
            <div className="fmz-empty-orb-ring-primary" />
            <div className="fmz-empty-orb-ring-secondary" />
            <div className="fmz-empty-orb-center">
              <Clock className="fmz-empty-orb-icon" aria-hidden="true" />
            </div>
            <div className="fmz-empty-orb-dot" />
            <div className="fmz-empty-orb-dot fmz-empty-orb-dot-secondary" />
          </div>

          <p className="fmz-empty-eyebrow">✦ Verificação concluída</p>
          <h1 id="fmz-awaiting-property-title" className="fmz-empty-title">Seu imóvel está quase pronto</h1>
          <p className="fmz-empty-description">
            Seu cadastro e a verificação de identidade já foram concluídos. Nossa equipe está
            formalizando seu contrato de aluguel — assim que ele for ativado, as informações do
            seu imóvel aparecerão aqui automaticamente.
          </p>

          <div className="fmz-empty-steps" aria-label="Etapas do seu cadastro">
            {STEPS.map((step) => (
              <article key={step.id} className="fmz-empty-step-card">
                <span className="fmz-empty-step-bar" aria-hidden="true" />
                <p className="fmz-empty-step-number">{step.number}</p>
                <h2 className="fmz-empty-step-title">{step.title}</h2>
                <p className="fmz-empty-step-description">{step.description}</p>
              </article>
            ))}
          </div>

          <a
            href={fmzPublicLayoutConfig.helpUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="fmz-empty-cta"
          >
            <MessageCircle className="fmz-empty-cta-icon" aria-hidden="true" />
            Falar com a gente
          </a>
        </div>
      </section>

      <FmzInstagramFeedSection />
      <span className="sr-only">Feed conectado em {fmzInstagramFeedConfig.profileUrl}</span>
    </div>
  );
}
