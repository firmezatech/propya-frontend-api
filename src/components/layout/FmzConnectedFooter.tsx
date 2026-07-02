'use client';

import { useEffect, useState } from 'react';
import { fmzPublicLayoutConfig } from '../../config/fmz-public-layout-config';
import { getPlatformInfo, type FmzPlatformInfo } from '../../features/tenant-portal/services/fmz-platform-info-api';

// Footer social networks, in display order, each mapped to its platform_parameters key. The DB
// value (set in admin "Configurações → Redes sociais") takes precedence; when empty we fall back
// to the build-time config link (fmzPublicLayoutConfig.socialLinks). A network with neither is hidden.
const SOCIALS: { label: string; key: keyof FmzPlatformInfo }[] = [
  { label: 'TikTok', key: 'social_tiktok' },
  { label: 'Instagram', key: 'social_instagram' },
  { label: 'LinkedIn', key: 'social_linkedin' },
  { label: 'YouTube', key: 'social_youtube' },
  { label: 'Facebook', key: 'social_facebook' },
  { label: 'X', key: 'social_x' },
];

const CONFIG_HREF_BY_LABEL = new Map(fmzPublicLayoutConfig.socialLinks.map((link) => [link.label, link.href]));

export function FmzConnectedFooter() {
  const [info, setInfo] = useState<FmzPlatformInfo | null>(null);

  useEffect(() => {
    getPlatformInfo().then(setInfo);
  }, []);

  const links = SOCIALS
    .map((social) => ({
      label: social.label,
      href: (info?.[social.key] ?? null) || CONFIG_HREF_BY_LABEL.get(social.label) || null,
    }))
    .filter((link): link is { label: string; href: string } => Boolean(link.href));

  return (
    <footer className="mt-auto flex min-h-[60px] shrink-0 items-center justify-between gap-4 border-t border-fmz-border-light bg-white px-6 py-4 md:px-14">
      <span className="text-[13px] text-fmz-text-hint">{fmzPublicLayoutConfig.footerTagline}</span>
      <nav aria-label="Redes sociais" className="flex flex-wrap gap-5">
        {links.map((link) => (
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
