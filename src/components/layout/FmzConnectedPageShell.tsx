import type { PropsWithChildren } from 'react';
import { fmzCn } from '../../lib/fmz-classnames';

type FmzConnectedPageShellProps = PropsWithChildren<{
  className?: string;
  width?: 'default' | 'wide';
}>;

const widthClassNames = {
  default: 'max-w-[860px]',
  wide: 'max-w-7xl',
} as const;

export function FmzConnectedPageShell({ children, className, width = 'wide' }: FmzConnectedPageShellProps) {
  return (
    <main className={fmzCn('mx-auto w-full flex-1 px-6 py-12 md:px-14 md:pb-20', widthClassNames[width], className)}>
      {children}
    </main>
  );
}
