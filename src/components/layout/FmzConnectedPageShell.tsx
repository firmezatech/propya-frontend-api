import type { PropsWithChildren } from 'react';
import { fmzCn } from '../../lib/fmz-classnames';

type FmzConnectedPageShellProps = PropsWithChildren<{
  className?: string;
  width?: 'default' | 'wide';
}>;

const widthClassNames = {
  default: 'max-w-[860px]',
  wide: 'max-w-[1480px]',
} as const;

export function FmzConnectedPageShell({ children, className, width = 'wide' }: FmzConnectedPageShellProps) {
  return (
    <main className={fmzCn('mx-auto w-full flex-1 px-5 py-10 sm:px-6 md:px-10 lg:px-12 xl:px-14 md:pb-20', widthClassNames[width], className)}>
      {children}
    </main>
  );
}
