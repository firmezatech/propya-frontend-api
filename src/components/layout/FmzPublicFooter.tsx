'use client';

import { fmzPublicLayoutConfig } from '../../config/fmz-public-layout-config';

export function FmzPublicFooter() {
  return (
    // Spacing utilities use `!` so they survive inside the login/register shells'
    // legacy scoped `* { margin:0; padding:0 }` reset (same specificity tie as
    // Tailwind's utility classes, resolved by source order — see FmzAuthHeader,
    // which has the identical problem). No max-width here on purpose: this footer
    // pairs with FmzAuthHeader on every page that uses it, and that header is
    // edge-to-edge with the same clamp() padding — capping the footer at max-w-7xl
    // while the header spans full width made the footer look misaligned on wide screens.
    <footer className="shrink-0 border-t border-fmz-border-light bg-white">
      <div className="flex min-h-[60px] w-full flex-col items-center justify-between gap-3 !px-[clamp(20px,4vw,40px)] !py-4 md:flex-row md:!py-0">
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
