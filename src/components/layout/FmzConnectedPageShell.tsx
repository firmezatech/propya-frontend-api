import type { PropsWithChildren } from 'react';
import { fmzCn } from '../../lib/fmz-classnames';

type FmzConnectedPageShellProps = PropsWithChildren<{
  className?: string;
  width?: 'default' | 'wide' | 'tenant';
}>;

const widthClassNames = {
  default: 'max-w-[860px]',
  wide: 'max-w-[1480px]',
  tenant: 'max-w-[1360px]',
} as const;

export function FmzConnectedPageShell({ children, className, width = 'wide' }: FmzConnectedPageShellProps) {
  return (
    <main className={fmzCn('mx-auto w-full flex-1 px-5 py-10 sm:px-6 md:px-10 lg:px-12 xl:px-14 md:pb-20', widthClassNames[width], className)}>
      {children}
    </main>
  );
}

/**
 * Width-only frame for legacy pages that manage their own padding.
 * Constrains content to the same 1360px max-width as the tenant dashboard.
 */
export function FmzTenantContentFrame({ children, className }: PropsWithChildren<{ className?: string }>) {
  return (
    <div className={fmzCn('mx-auto w-full flex-1', widthClassNames.tenant, className)}>
      {children}
    </div>
  );
}

/**
 * Suspense-fallback frame for tenant pages (wallet, payment history, invoice,
 * contract). It reproduces the exact chrome the loaded page renders — the
 * `width="tenant"` shell plus the inner 1100px content column (the `.page`
 * container each tenant module uses) — so the skeleton occupies the same width
 * as the real content and there is no layout jump when the page mounts.
 */
export function FmzTenantPageSkeletonFrame({ children }: PropsWithChildren) {
  return (
    <FmzConnectedPageShell width="tenant">
      <div className="mx-auto w-full max-w-[1100px]">{children}</div>
    </FmzConnectedPageShell>
  );
}
