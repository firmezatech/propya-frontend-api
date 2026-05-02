export type FmzSocialLink = {
  label: string;
  href: string;
};

const getPublicEnvValue = (key: string, fallback: string): string => {
  const value = process.env[key];
  return value && value.trim().length > 0 ? value.trim() : fallback;
};

const buildSocialLink = (label: string, envKey: string, fallbackHref: string): FmzSocialLink => ({
  label,
  href: getPublicEnvValue(envKey, fallbackHref),
});

export const fmzPublicLayoutConfig = {
  appName: getPublicEnvValue('NEXT_PUBLIC_FMZ_APP_NAME', 'FirmezaToken'),
  helpUrl: getPublicEnvValue('NEXT_PUBLIC_FMZ_HELP_URL', 'https://wa.me/5511964850279'),
  homePath: getPublicEnvValue('NEXT_PUBLIC_FMZ_HOME_PATH', '/'),
  logoPath: getPublicEnvValue('NEXT_PUBLIC_FMZ_LOGO_PATH', '/logo.png'),
  footerTagline: getPublicEnvValue(
    'NEXT_PUBLIC_FMZ_FOOTER_TAGLINE',
    'A revolução imobiliária começou. Siga Firmeza Token!',
  ),
  socialLinks: [
    buildSocialLink('TikTok', 'NEXT_PUBLIC_FMZ_TIKTOK_URL', 'https://vm.tiktok.com/ZMBpFWsJ6/'),
    buildSocialLink('Instagram', 'NEXT_PUBLIC_FMZ_INSTAGRAM_URL', 'https://www.instagram.com/firmezatoken/'),
    buildSocialLink('LinkedIn', 'NEXT_PUBLIC_FMZ_LINKEDIN_URL', 'https://www.linkedin.com/company/firmeza-token/'),
    buildSocialLink('YouTube', 'NEXT_PUBLIC_FMZ_YOUTUBE_URL', 'https://www.youtube.com/@FirmezaToken'),
  ],
} as const;
