'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { FmzBrandMark } from './FmzBrandMark';
import { fmzPublicLayoutConfig } from '../../config/fmz-public-layout-config';

const buildInitials = (name: string | null): string => {
  if (!name) return 'FT';

  const [firstName, secondName] = name
    .split(' ')
    .map((part) => part.trim())
    .filter(Boolean);

  return `${firstName?.[0] ?? 'F'}${secondName?.[0] ?? firstName?.[1] ?? 'T'}`.toUpperCase();
};

export function FmzConnectedHeader() {
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    setUserName(localStorage.getItem('name'));
  }, []);

  const userInitials = useMemo(() => buildInitials(userName), [userName]);

  return (
    <header className="sticky top-0 z-10 h-[72px] border-b border-fmz-border-light bg-white">
      <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between px-6 md:px-14">
        <Link href="/connected/dashboard" aria-label={fmzPublicLayoutConfig.appName} className="no-underline">
          <FmzBrandMark size="header" />
        </Link>

        <nav aria-label="Navegação da área conectada" className="flex items-center gap-7">
          <Link
            href={fmzPublicLayoutConfig.helpUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-fmz-text-muted no-underline transition hover:text-fmz-text-primary"
          >
            Ajuda
          </Link>
          <Link
            href="/connected/account"
            aria-label="Minha conta"
            className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-fmz-navy font-syne text-[13px] font-bold tracking-[0.02em] text-fmz-gold no-underline"
          >
            {userInitials}
          </Link>
        </nav>
      </div>
    </header>
  );
}
