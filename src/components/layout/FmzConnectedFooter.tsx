import { fmzPublicLayoutConfig } from '../../config/fmz-public-layout-config';

export function FmzConnectedFooter() {
  return (
    <footer className="flex min-h-[60px] items-center justify-between gap-4 border-t border-fmz-border-light bg-white px-6 py-4 md:px-14">
      <span className="text-[13px] text-fmz-text-hint">{fmzPublicLayoutConfig.footerTagline}</span>
      <nav aria-label="Redes sociais" className="flex flex-wrap gap-5">
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
    </footer>
  );
}
