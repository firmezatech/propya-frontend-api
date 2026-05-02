'use client';

import { useTranslations } from 'next-intl';
import { FmzAuthAccessCard } from '../../../features/auth-access/components/FmzAuthAccessCard';
import FirmezaCalculator from './Calculator';

export default function Home() {
  const t = useTranslations('HomePage');

  return (
    <section className="flex flex-col justify-start items-center bg-white py-2 gap-20 mb-36">
      <div className="w-11/12 max-w-7xl mx-auto flex flex-col lg:flex-row items-start justify-between gap-6 px-2">
        <div className="lg:w-3/5 text-left">
          <h3 className="text-blue-500 uppercase tracking-wide font-semibold text-sm">
            {t('title')}
          </h3>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">
            {t('subtitle')}
          </h1>
          <p className="text-gray-600 mt-4">
            {t('description')}
          </p>
          <div className="mt-16">
            <FirmezaCalculator />
          </div>
        </div>
        <FmzAuthAccessCard className="lg:w-2/5 w-full items-right max-w-md p-6 py-4 rounded-2xl border bg-white" />
      </div>
    </section>
  );
}
