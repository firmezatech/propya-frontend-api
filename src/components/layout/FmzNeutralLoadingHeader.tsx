// ─── FmzNeutralLoadingHeader ──────────────────────────────────────────────────
// Skeleton header shown while access-control data is loading.
//
// Invariants:
//   - Contains NO tenant-specific elements (no tenant dropdown, no role label).
//   - Contains NO admin-specific elements (no admin sidebar controls).
//   - Reserves the same space as the final admin header (72px, grid layout)
//     so the admin user sees zero layout shift after resolution.
//   - Skeleton shapes match the dimensions of their final counterparts:
//       • Notification bell button: 38×38 px
//       • User identity pill:       ≈44×180 px
//
// This component is Server-Component-safe (no 'use client' directive needed).

import { FmzBrandMark } from './FmzBrandMark';
import { fmzAdminShellLayoutConfig } from '../../config/fmz-admin-sidebar-layout-config';
import { fmzCn } from '../../lib/fmz-classnames';

export function FmzNeutralLoadingHeader() {
  return (
    <header
      aria-hidden="true"
      className="sticky top-0 z-50 h-[72px] shrink-0 border-b border-fmz-border-light bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85"
    >
      <div className={fmzCn('grid h-full w-full grid-cols-[minmax(0,1fr)_auto] items-center', fmzAdminShellLayoutConfig.headerSidebarColumn)}>

        {/* Logo column — always visible, never role-specific */}
        <div className="flex h-full min-w-0 items-center px-[clamp(18px,4vw,48px)] lg:border-r lg:border-fmz-border-light">
          <FmzBrandMark size="header" />
        </div>

        {/* Skeleton actions — same dimensions as the final admin header actions */}
        <div className="flex min-w-[220px] items-center justify-end gap-3 px-[clamp(18px,4vw,48px)]">
          {/* Notification bell placeholder */}
          <div
            aria-hidden="true"
            className="h-[38px] w-[38px] shrink-0 animate-pulse rounded-[10px] bg-fmz-page"
          />
          {/* User identity placeholder */}
          <div
            aria-hidden="true"
            className="h-[44px] w-[180px] animate-pulse rounded-full bg-fmz-page"
          />
        </div>
      </div>
    </header>
  );
}
