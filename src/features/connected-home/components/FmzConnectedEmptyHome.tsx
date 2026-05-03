'use client';

import { LockKeyhole, Plus } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { FmzInstagramFeedSection } from '../../instagram-feed/components/FmzInstagramFeedSection';
import { fmzInstagramFeedConfig } from '../../instagram-feed/config';
import { fmzConnectedEmptyHomeConfig } from '../config/fmz-connected-empty-home.config';

const buildLocalizedPath = (locale: string | undefined, path: string): string => `${locale ? `/${locale}` : ''}${path}`;

export function FmzConnectedEmptyHome() {
  const router = useRouter();
  const params = useParams<{ locale?: string }>();

  return (
    <div className="fmz-connected-empty-home">
      <section className="fmz-empty-hero" aria-labelledby="fmz-empty-home-title">
        <div className="fmz-empty-orb" aria-hidden="true">
          <div className="fmz-empty-orb-ring-primary" />
          <div className="fmz-empty-orb-ring-secondary" />
          <div className="fmz-empty-orb-center">
            <LockKeyhole className="fmz-empty-orb-icon" aria-hidden="true" />
          </div>
          <div className="fmz-empty-orb-dot" />
          <div className="fmz-empty-orb-dot fmz-empty-orb-dot-secondary" />
        </div>

        <p className="fmz-empty-eyebrow">{fmzConnectedEmptyHomeConfig.eyebrow}</p>
        <h1 id="fmz-empty-home-title" className="fmz-empty-title">{fmzConnectedEmptyHomeConfig.title}</h1>
        <p className="fmz-empty-description">{fmzConnectedEmptyHomeConfig.description}</p>

        <div className="fmz-empty-steps" aria-label="Próximos passos">
          {fmzConnectedEmptyHomeConfig.steps.map((step) => (
            <article key={step.id} className="fmz-empty-step-card">
              <span className="fmz-empty-step-bar" aria-hidden="true" />
              <p className="fmz-empty-step-number">{step.number}</p>
              <h2 className="fmz-empty-step-title">{step.title}</h2>
              <p className="fmz-empty-step-description">{step.description}</p>
            </article>
          ))}
        </div>

        <button type="button" onClick={() => router.push(buildLocalizedPath(params?.locale, fmzConnectedEmptyHomeConfig.ctaPath))} className="fmz-empty-cta">
          <Plus className="fmz-empty-cta-icon" aria-hidden="true" />
          {fmzConnectedEmptyHomeConfig.ctaLabel}
        </button>
      </section>

      <FmzInstagramFeedSection />
      <span className="sr-only">Feed conectado em {fmzInstagramFeedConfig.profileUrl}</span>
    </div>
  );
}
