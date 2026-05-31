'use client';

import type { ReactNode } from 'react';
import { Link } from '../../i18n/navigation';
import { FmzBrandMark } from './FmzBrandMark';

type FmzAuthHeaderProps = {
  contextLabel: string;
  helperText?: string;
  actionHref: string;
  actionLabel: string;
  actionIcon?: ReactNode;
  ariaLabel: string;
};

/**
 * Shared public auth header (login, register, password recovery / reset).
 *
 * Self-contained: every visual rule lives here as Tailwind utilities so the
 * component renders identically on any page, with or without a surrounding
 * scoped-CSS shell. The page name always appears after the logo (logo · divider
 * · context pill), matching the reference navigation.
 *
 * The brand is centralized in FmzBrandMark, which reads /public/logo.png through
 * fmzPublicLayoutConfig.logoPath.
 */
export function FmzAuthHeader({
  contextLabel,
  helperText,
  actionHref,
  actionLabel,
  actionIcon,
  ariaLabel,
}: FmzAuthHeaderProps) {
  return (
    <nav
      aria-label={ariaLabel}
      className="sticky top-0 z-[100] flex h-[68px] items-center justify-between gap-[18px] border-b border-fmz-border-light bg-white/90 px-[clamp(20px,4vw,40px)] backdrop-blur-md backdrop-saturate-150"
    >
      <div className="flex min-w-0 items-center gap-3.5">
        <Link href="/" aria-label="FirmezaToken" className="no-underline">
          <FmzBrandMark size="header" />
        </Link>
        <span aria-hidden="true" className="mx-1 hidden h-[22px] w-px shrink-0 bg-fmz-border-light md:block" />
        <span className="hidden items-center gap-[7px] whitespace-nowrap text-[12.5px] font-medium text-fmz-text-muted md:flex">
          <span className="h-[5px] w-[5px] shrink-0 rounded-full bg-fmz-gold shadow-[0_0_0_3px_rgba(245,200,66,0.22)]" />
          <strong className="font-semibold text-fmz-navy">{contextLabel}</strong>
        </span>
      </div>

      <div className="flex items-center gap-3.5 text-[13px] text-fmz-text-muted">
        {helperText ? <span className="hidden sm:inline">{helperText}</span> : null}
        <Link
          href={actionHref}
          className="inline-flex items-center gap-1.5 rounded-[10px] border-[1.5px] border-fmz-border-light bg-white px-3.5 py-2 text-[13px] font-semibold text-fmz-navy no-underline transition hover:-translate-y-px hover:border-fmz-navy hover:shadow-[0_6px_18px_rgba(13,19,33,0.08)] [&_svg]:h-[13px] [&_svg]:w-[13px] [&_svg]:text-fmz-gold-dark"
        >
          {actionIcon}
          {actionLabel}
        </Link>
      </div>
    </nav>
  );
}
