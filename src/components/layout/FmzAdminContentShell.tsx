import type { PropsWithChildren } from 'react';
import { fmzCn } from '../../lib/fmz-classnames';

type FmzAdminContentShellProps = PropsWithChildren<{
  className?: string;
}>;

/**
 * Centralizes the spacing and content width for every administrative screen.
 * Keep page components focused on their own content; layout concerns stay here.
 */
export function FmzAdminContentShell({ children, className }: FmzAdminContentShellProps) {
  return (
    <main
      className={fmzCn(
        'fmz-admin-content-shell mx-auto flex w-full max-w-[1480px] flex-1 flex-col px-5 py-8 text-[#0D1321] sm:px-6 lg:px-10 xl:px-12 2xl:px-14',
        className,
      )}
    >
      {children}
    </main>
  );
}
