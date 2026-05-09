import type { PropsWithChildren } from 'react';
import { FmzPublicFooter } from './FmzPublicFooter';
import { FmzPublicHeader } from './FmzPublicHeader';

export function FmzPublicPageShell({ children }: PropsWithChildren) {
  return (
    <div className="grid min-h-screen min-h-[100dvh] grid-rows-[auto_minmax(0,1fr)_auto] bg-white text-fmz-text-primary">
      <FmzPublicHeader />
      <main className="flex min-h-0 items-center justify-center overflow-y-auto bg-white px-6 py-10 sm:py-[60px]">
        {children}
      </main>
      <FmzPublicFooter />
    </div>
  );
}
