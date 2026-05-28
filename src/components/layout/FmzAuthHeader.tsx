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
 * Shared public auth header used by login and register pages.
 * The brand is centralized in FmzBrandMark, which reads /public/logo.png
 * through fmzPublicLayoutConfig.logoPath.
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
    <nav className="nav" aria-label={ariaLabel}>
      <div className="nav-l">
        <Link href="/" className="logo" aria-label="FirmezaToken">
          <FmzBrandMark size="header" />
        </Link>
        <span className="logo-divider" />
        <span className="logo-context"><strong>{contextLabel}</strong></span>
      </div>
      <div className="nav-r">
        {helperText ? <span className="nv-q">{helperText}</span> : null}
        <Link href={actionHref} className="nv-link">
          {actionIcon}
          {actionLabel}
        </Link>
      </div>
    </nav>
  );
}
