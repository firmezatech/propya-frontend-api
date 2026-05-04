'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo } from 'react';
import { fmzPublicLayoutConfig } from '../../config/fmz-public-layout-config';
import { FmzBrandMark } from './FmzBrandMark';
import { FmzConnectedUserIdentity } from './FmzConnectedUserIdentity';

const buildFmzLocalizedHref = (locale: string | undefined, href: string): string => `${locale ? `/${locale}` : ''}${href}`;

export function FmzConnectedHeader() {
  const params = useParams<{ locale?: string }>();

  const localizeHref = useMemo(() => {
    return (href: string) => buildFmzLocalizedHref(params?.locale, href);
  }, [params?.locale]);

  return (
    <header className="sticky top-0 z-50 h-[72px] border-b border-fmz-border-light bg-white">
      <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between px-6 md:px-14">
        <Link href={localizeHref(fmzPublicLayoutConfig.connectedDashboardPath)} aria-label={fmzPublicLayoutConfig.appName} className="no-underline">
          <FmzBrandMark size="header" />
        </Link>

        <FmzConnectedUserIdentity />
      </div>
    </header>
  );
}
