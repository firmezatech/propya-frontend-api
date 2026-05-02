import type { PropsWithChildren } from 'react';
import { FmzPublicFooter } from './FmzPublicFooter';
import { FmzPublicHeader } from './FmzPublicHeader';

export function FmzPublicPageShell({ children }: PropsWithChildren) {
  return (
    <div className="flex min-h-screen flex-col bg-white text-fmz-text-primary">
      <FmzPublicHeader />
      <main className="flex flex-1 items-center justify-center bg-white px-6 py-[60px]">
        {children}
      </main>
      <FmzPublicFooter />
    </div>
  );
}
