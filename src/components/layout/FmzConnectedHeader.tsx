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

const ADMIN_SIDEBAR_WIDTH_CLASS = 'lg:grid-cols-[clamp(280px,18vw,320px)_minmax(0,1fr)]';

const buildFmzLocalizedHref = (locale: string | undefined, href: string): string => `${locale ? `/${locale}` : ''}${href}`;

export function FmzConnectedHeader({ adminOffset = false }: FmzConnectedHeaderProps) {
  const params = useParams<{ locale?: string }>();

  const localizeHref = useMemo(() => {
    return (href: string) => buildFmzLocalizedHref(params?.locale, href);
  }, [params?.locale]);

  if (adminOffset) {
    return (
      <header className="sticky top-0 z-50 h-[72px] border-b border-fmz-border-light bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
        <div className={fmzCn('grid h-full w-full grid-cols-[minmax(0,1fr)_auto] items-center', ADMIN_SIDEBAR_WIDTH_CLASS)}>
          <Link
            href={localizeHref(fmzPublicLayoutConfig.connectedDashboardPath)}
            aria-label={fmzPublicLayoutConfig.appName}
            className="flex h-full min-w-0 items-center px-5 no-underline sm:px-6 lg:border-r lg:border-fmz-border-light"
          >
            <FmzBrandMark size="header" />
          </Link>

          <div className="flex min-w-0 justify-end px-5 sm:px-6 lg:px-10 xl:px-14">
            <FmzConnectedUserIdentity />
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 h-[72px] border-b border-fmz-border-light bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between gap-4 px-6 md:px-14">
        <Link href={localizeHref(fmzPublicLayoutConfig.connectedDashboardPath)} aria-label={fmzPublicLayoutConfig.appName} className="min-w-0 no-underline">
          <FmzBrandMark size="header" />
        </Link>

        <FmzConnectedUserIdentity />
      </div>
    </header>
  );
}
