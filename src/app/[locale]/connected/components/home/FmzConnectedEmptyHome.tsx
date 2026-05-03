'use client';

import { LockKeyhole, Plus } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { fmzPublicLayoutConfig } from '../../../../../config/fmz-public-layout-config';

const emptyHomeSteps = [
  { id: 'profile', number: '01', title: 'Complete seu perfil', description: 'Verifique seus dados pessoais' },
  { id: 'properties', number: '02', title: 'Explore imóveis', description: 'Encontre oportunidades na plataforma' },
  { id: 'investment', number: '03', title: 'Invista a partir de R$500', description: 'Com segurança e transparência' },
] as const;

const buildLocalizedPath = (locale: string | undefined, path: string): string => `${locale ? `/${locale}` : ''}${path}`;

export function FmzConnectedEmptyHome() {
  const router = useRouter();
  const params = useParams<{ locale?: string }>();

  return (
    <section className="flex min-h-[calc(100vh-132px)] flex-1 flex-col items-center justify-center px-6 py-[60px] text-center">
      <div className="relative mb-10 h-[180px] w-[180px]">
        <div className="fmz-empty-spin absolute inset-0 rounded-full border-2 border-dashed border-fmz-border-mid" />
        <div className="fmz-empty-spin-reverse absolute inset-5 rounded-full border-[1.5px] border-fmz-border-light" />
        <div className="absolute inset-11 flex items-center justify-center rounded-full border-[1.5px] border-fmz-border-light bg-white shadow-[0_4px_20px_rgba(13,19,33,0.06)]">
          <LockKeyhole className="h-10 w-10 text-fmz-navy" aria-hidden="true" />
        </div>
        <div className="fmz-empty-orbit absolute left-1/2 top-1/2 h-2.5 w-2.5 rounded-full bg-fmz-gold" />
        <div className="fmz-empty-orbit-reverse absolute left-1/2 top-1/2 h-[7px] w-[7px] rounded-full bg-fmz-navy/30" />
      </div>

      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-fmz-gold-dark">✦ Sua jornada começa aqui</p>
      <h1 className="mb-3 font-syne text-[26px] font-extrabold leading-[1.15] tracking-[-0.025em] text-fmz-navy">Ainda não há nada<br />por aqui</h1>
      <p className="mb-9 max-w-[380px] text-[15px] leading-[1.65] text-fmz-text-muted">Você ainda não possui investimentos ou imóveis associados à sua conta. Explore as oportunidades disponíveis e dê o primeiro passo.</p>

      <div className="mb-10 flex flex-wrap justify-center gap-3">
        {emptyHomeSteps.map((step) => (
          <article key={step.id} className="relative w-40 overflow-hidden rounded-[14px] border-[1.5px] border-fmz-border-light bg-white px-5 py-[18px] text-left transition hover:-translate-y-0.5 hover:border-fmz-gold">
            <span className="absolute left-0 right-0 top-0 h-0.5 bg-gradient-to-r from-fmz-gold to-transparent" />
            <p className="mb-2 font-syne text-[22px] font-extrabold leading-none text-fmz-gold">{step.number}</p>
            <h2 className="text-[13px] font-medium leading-[1.4] text-fmz-navy">{step.title}</h2>
            <p className="mt-1 text-[11.5px] leading-[1.4] text-fmz-text-hint">{step.description}</p>
          </article>
        ))}
      </div>

      <button type="button" onClick={() => router.push(buildLocalizedPath(params?.locale, fmzPublicLayoutConfig.connectedAccountPath))} className="inline-flex items-center gap-2 rounded-[10px] border-0 bg-fmz-navy px-8 py-3.5 font-syne text-sm font-bold uppercase tracking-[0.04em] text-white transition hover:-translate-y-px hover:bg-[#162030] hover:shadow-[0_8px_24px_rgba(13,19,33,0.15)]">
        <Plus className="h-[15px] w-[15px]" aria-hidden="true" />
        Completar meu perfil
      </button>
    </section>
  );
}
