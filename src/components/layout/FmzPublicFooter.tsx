'use client';

import { fmzPublicLayoutConfig } from '../../config/fmz-public-layout-config';

export function FmzPublicFooter() {
  return (
    <footer className="border-t border-fmz-border-light bg-white">
      <div className="mx-auto flex min-h-[60px] w-full max-w-7xl flex-col items-center justify-between gap-3 px-6 py-4 md:flex-row md:px-14 md:py-0">
        <span className="text-center text-[13px] text-fmz-text-hint md:text-left">
          {fmzPublicLayoutConfig.footerTagline}
        </span>
        <nav aria-label="Redes sociais" className="flex flex-wrap justify-center gap-5">
          {fmzPublicLayoutConfig.socialLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] text-fmz-text-hint no-underline transition hover:text-fmz-text-primary"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
