'use client';

import { useTranslations } from 'next-intl';
import { FmzAuthAccessCard } from '../../../features/auth-access/components/FmzAuthAccessCard';
import FirmezaCalculator from './Calculator';

export default function HomeCalculator() {
  const t = useTranslations('HomePage');

  return (
    <section className="w-full max-w-7xl">
      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_440px]">
        <div className="text-left">
          <p className="font-sans text-sm font-bold uppercase tracking-[0.08em] text-fmz-gold-dark">
            {t('title')}
          </p>
          <h1 className="mt-2 font-sans text-3xl font-extrabold tracking-[-0.025em] text-fmz-navy md:text-4xl">
            {t('subtitle')}
          </h1>
          <p className="mt-4 max-w-2xl text-fmz-text-muted">
            {t('description')}
          </p>
          <div className="mt-12">
            <FirmezaCalculator />
          </div>
        </div>
        <FmzAuthAccessCard />
      </div>
    </section>
  );
}
