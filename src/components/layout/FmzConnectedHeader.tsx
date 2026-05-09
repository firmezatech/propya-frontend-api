'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo } from 'react';
import { fmzPublicLayoutConfig } from '../../config/fmz-public-layout-config';
import { fmzCn } from '../../lib/fmz-classnames';
import { FmzBrandMark } from './FmzBrandMark';
import { FmzConnectedUserIdentity } from './FmzConnectedUserIdentity';

export type FmzConnectedHeaderProps = {
  adminOffset?: boolean;
};

const buildFmzLocalizedHref = (locale: string | undefined, href: string): string => `${locale ? `/${locale}` : ''}${href}`;

export function FmzConnectedHeader({ adminOffset = false }: FmzConnectedHeaderProps) {
  const params = useParams<{ locale?: string }>();

  const localizeHref = useMemo(() => {
    return (href: string) => buildFmzLocalizedHref(params?.locale, href);
  }, [params?.locale]);

  return (
    <header className="sticky top-0 z-50 h-[72px] border-b border-fmz-border-light bg-white">
      <div
        className={fmzCn(
          'flex h-full w-full items-center justify-between gap-4 px-6 transition-[padding] duration-200 md:px-14',
          !adminOffset && 'mx-auto max-w-7xl',
          adminOffset && 'lg:pl-[calc(clamp(260px,18vw,340px)+2.5rem)] lg:pr-10 xl:pr-14',
        )}
      >
        <Link href={localizeHref(fmzPublicLayoutConfig.connectedDashboardPath)} aria-label={fmzPublicLayoutConfig.appName} className="min-w-0 no-underline">
          <FmzBrandMark size="header" />
        </Link>

        <FmzConnectedUserIdentity />
      </div>
    </header>
  );
}
