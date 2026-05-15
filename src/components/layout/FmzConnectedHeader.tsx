'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { FileText, Home, LogOut, ReceiptText, Settings, UserRound, WalletCards, Wrench } from 'lucide-react';
import { useMemo } from 'react';
import { fmzPublicLayoutConfig } from '../../config/fmz-public-layout-config';
import type { FmzAccessControlPage, FmzAccessControlPrincipal } from '../../features/access-control/domain';
import { normalizeFmzPath } from '../../features/access-control/domain';
import { fmzCn } from '../../lib/fmz-classnames';
import { FmzBrandMark } from './FmzBrandMark';
import { FmzConnectedDropdown } from './connected-dropdown';
import type { FmzConnectedDropdownItem } from './connected-dropdown';
import { FmzConnectedUserIdentity } from './FmzConnectedUserIdentity';

export type FmzConnectedHeaderProps = {
  adminOffset?: boolean;
  principal?: FmzAccessControlPrincipal | null;
};

const ADMIN_SIDEBAR_WIDTH_CLASS = 'lg:grid-cols-[clamp(280px,18vw,320px)_minmax(0,1fr)]';

const buildFmzLocalizedHref = (locale: string | undefined, href: string): string => `${locale ? `/${locale}` : ''}${href}`;

const isVisibleConnectedPage = (page: FmzAccessControlPage): boolean => {
  const path = normalizeFmzPath(page.path);
  return Boolean(page.key && path && path !== '#' && path !== '/' && !path.includes('['));
};

const resolveConnectedPageIcon = (page: FmzAccessControlPage): FmzConnectedDropdownItem['icon'] => {
  const key = page.key.toLowerCase();
  const path = page.path.toLowerCase();

  if (key.includes('dashboard') || path.includes('dashboard')) return Home;
  if (key.includes('account') || key.includes('profile') || path.includes('account')) return UserRound;
  if (key.includes('contract') || path.includes('contract') || path.includes('mycontract')) return FileText;
  if (key.includes('invoice') || key.includes('boleto') || key.includes('payment') || key.includes('fatura') || path.includes('invoice') || path.includes('issueinvoice') || path.includes('paymenthistory')) return ReceiptText;
  if (key.includes('wallet') || key.includes('token') || path.includes('wallet') || path.includes('mytokens')) return WalletCards;
  if (key.includes('maintenance') || key.includes('manutenc') || path.includes('maintenance')) return Wrench;
  if (key.includes('setting') || key.includes('config')) return Settings;

  return FileText;
};

const buildConnectedDropdownItems = (principal: FmzAccessControlPrincipal | null | undefined): FmzConnectedDropdownItem[] => {
  const pagesByKey = new Map<string, FmzAccessControlPage>();

  (principal?.accessiblePages ?? [])
    .filter(isVisibleConnectedPage)
    .sort((left, right) => left.order - right.order)
    .forEach((page) => {
      const key = page.key.trim().toLowerCase();
      if (!pagesByKey.has(key)) pagesByKey.set(key, page);
    });

  const pageItems: FmzConnectedDropdownItem[] = Array.from(pagesByKey.values()).map((page) => ({
    id: page.key,
    label: page.label || page.name || page.key,
    href: normalizeFmzPath(page.path),
    icon: resolveConnectedPageIcon(page),
    variant: 'default',
    section: 'main',
  }));

  return [
    ...pageItems,
    {
      id: 'logout',
      label: fmzPublicLayoutConfig.connectedLogoutLabel,
      href: fmzPublicLayoutConfig.connectedLogoutPath,
      icon: LogOut,
      variant: 'danger',
      section: 'session',
    },
  ];
};

export function FmzConnectedHeader({ adminOffset = false, principal = null }: FmzConnectedHeaderProps) {
  const params = useParams<{ locale?: string }>();

  const localizeHref = useMemo(() => {
    return (href: string) => buildFmzLocalizedHref(params?.locale, href);
  }, [params?.locale]);

  const connectedDropdownItems = useMemo(() => buildConnectedDropdownItems(principal), [principal]);

  if (adminOffset) {
    return (
      <header className="sticky top-0 z-50 h-[72px] shrink-0 border-b border-fmz-border-light bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
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
    <header className="sticky top-0 z-50 h-[72px] shrink-0 border-b border-fmz-border-light bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between gap-4 px-6 md:px-14">
        <Link href={localizeHref(fmzPublicLayoutConfig.connectedDashboardPath)} aria-label={fmzPublicLayoutConfig.appName} className="min-w-0 no-underline">
          <FmzBrandMark size="header" />
        </Link>

        <FmzConnectedDropdown
          items={connectedDropdownItems}
          localizeHref={localizeHref}
          defaultUserName={fmzPublicLayoutConfig.defaultConnectedUserName}
          defaultUserEmail={fmzPublicLayoutConfig.defaultConnectedUserEmail}
          locale={params?.locale}
        />
      </div>
    </header>
  );
}
