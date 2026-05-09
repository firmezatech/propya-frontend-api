'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { FmzBrandMark } from './FmzBrandMark';
import { fmzPublicLayoutConfig } from '../../config/fmz-public-layout-config';

export function FmzPublicHeader() {
  const t = useTranslations('Header');

  return (
    <header className="h-[72px] shrink-0 border-b border-fmz-border-light bg-white">
      <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between px-6 md:px-14">
        <Link href={fmzPublicLayoutConfig.homePath} aria-label={fmzPublicLayoutConfig.appName} className="no-underline">
          <FmzBrandMark size="header" />
        </Link>
        <nav aria-label="Navegação principal" className="flex items-center gap-7">
          <Link
            href={fmzPublicLayoutConfig.helpUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-fmz-text-muted no-underline transition hover:text-fmz-text-primary"
          >
            {t('helpLink')}
          </Link>
        </nav>
      </div>
    </header>
  );
}
