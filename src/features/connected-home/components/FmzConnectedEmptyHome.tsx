'use client';

import { LockKeyhole, Plus } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { fmzInstagramFeedConfig } from '../../instagram-feed/config';
import { FmzInstagramFeedSection } from '../../instagram-feed/components/FmzInstagramFeedSection';
import { fmzConnectedEmptyHomeConfig } from '../config/fmz-connected-empty-home.config';

const buildLocalizedPath = (locale: string | undefined, path: string): string => `${locale ? `/${locale}` : ''}${path}`;

export function FmzConnectedEmptyHome() {
  const router = useRouter();
  const params = useParams<{ locale?: string }>();

  return (
    <div className="flex flex-1 flex-col bg-white">
      <section className="flex flex-1 flex-col items-center justify-center px-4 py-10 text-center sm:px-6 sm:py-12 lg:px-8 lg:py-14">
        <div className="relative mb-6 h-[120px] w-[120px] sm:h-[150px] sm:w-[150px] lg:h-[180px] lg:w-[180px]">
          <div className="fmz-empty-spin absolute inset-0 rounded-full border-2 border-dashed border-fmz-border-mid" />
          <div className="fmz-empty-spin-reverse absolute inset-[14px] rounded-full border-[1.5px] border-fmz-border-light sm:inset-5" />
          <div className="absolute inset-8 flex items-center justify-center rounded-full border-[1.5px] border-fmz-border-light bg-white shadow-[0_4px_20px_rgba(13,19,33,0.06)] sm:inset-10 lg:inset-11">
            <LockKeyhole className="h-7 w-7 text-fmz-navy sm:h-9 sm:w-9 lg:h-10 lg:w-10" aria-hidden="true" />
          </div>
          <div className="fmz-empty-orbit absolute left-1/2 top-1/2 h-[7px] w-[7px] rounded-full bg-fmz-gold sm:h-2.5 sm:w-2.5" />
          <div className="fmz-empty-orbit-reverse absolute left-1/2 top-1/2 h-[5px] w-[5px] rounded-full bg-fmz-navy/30 sm:h-[7px] sm:w-[7px]" />
        </div>

        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.11em] text-fmz-gold-dark sm:mb-3 sm:text-[11px]">{fmzConnectedEmptyHomeConfig.eyebrow}</p>
        <h1 className="mb-2 max-w-[720px] font-syne text-[clamp(1.35rem,4vw,1.85rem)] font-extrabold leading-[1.12] tracking-[-0.025em] text-fmz-navy sm:mb-3">{fmzConnectedEmptyHomeConfig.title}</h1>
        <p className="mb-7 max-w-[min(90vw,420px)] text-[13px] leading-[1.65] text-fmz-text-muted sm:mb-9 sm:text-[15px]">{fmzConnectedEmptyHomeConfig.description}</p>

        <div className="mb-7 grid w-full max-w-[560px] grid-cols-1 gap-2 sm:mb-10 sm:grid-cols-3 sm:gap-3">
          {fmzConnectedEmptyHomeConfig.steps.map((step) => (
            <article key={step.id} className="relative min-h-[104px] overflow-hidden rounded-xl border-[1.5px] border-fmz-border-light bg-fmz-page px-4 py-3 text-left transition hover:-translate-y-0.5 hover:border-fmz-gold sm:rounded-[14px] sm:bg-white sm:px-5 sm:py-[18px]">
              <span className="absolute left-0 right-0 top-0 h-0.5 bg-gradient-to-r from-fmz-gold to-transparent" />
              <p className="mb-1 font-syne text-[17px] font-extrabold leading-none text-fmz-gold sm:mb-2 sm:text-[22px]">{step.number}</p>
              <h2 className="text-[12px] font-medium leading-[1.4] text-fmz-navy sm:text-[13px]">{step.title}</h2>
              <p className="mt-0.5 text-[10.5px] leading-[1.4] text-fmz-text-hint sm:mt-1 sm:text-[11.5px]">{step.description}</p>
            </article>
          ))}
        </div>

        <button type="button" onClick={() => router.push(buildLocalizedPath(params?.locale, fmzConnectedEmptyHomeConfig.ctaPath))} className="inline-flex items-center gap-1.5 rounded-lg border-0 bg-fmz-navy px-6 py-3 font-syne text-[12.5px] font-bold uppercase tracking-[0.04em] text-white transition hover:-translate-y-px hover:bg-[#162030] hover:shadow-[0_8px_24px_rgba(13,19,33,0.15)] sm:gap-2 sm:rounded-[10px] sm:px-8 sm:py-3.5 sm:text-sm">
          <Plus className="h-3.5 w-3.5 sm:h-[15px] sm:w-[15px]" aria-hidden="true" />
          {fmzConnectedEmptyHomeConfig.ctaLabel}
        </button>
      </section>

      <FmzInstagramFeedSection />
      <span className="sr-only">Feed conectado em {fmzInstagramFeedConfig.profileUrl}</span>
    </div>
  );
}
