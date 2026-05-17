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
