import { getPublicEnvValue } from '../lib/fmz-env';

export type FmzSocialLink = {
  label: string;
  href: string;
};

const buildSocialLink = (label: string, envKey: string, fallbackHref: string): FmzSocialLink => ({
  label,
  href: getPublicEnvValue(envKey, fallbackHref),
});

export const fmzPublicLayoutConfig = {
  appName: getPublicEnvValue('NEXT_PUBLIC_FMZ_APP_NAME', 'FirmezaToken'),
  helpUrl: getPublicEnvValue('NEXT_PUBLIC_FMZ_HELP_URL', 'https://wa.me/5511964850279'),
  homePath: getPublicEnvValue('NEXT_PUBLIC_FMZ_HOME_PATH', '/'),
  connectedDashboardPath: getPublicEnvValue('NEXT_PUBLIC_FMZ_CONNECTED_DASHBOARD_PATH', '/connected/dashboard'),
  connectedAccountPath: getPublicEnvValue('NEXT_PUBLIC_FMZ_CONNECTED_ACCOUNT_PATH', '/connected/account'),
  connectedLogoutPath: getPublicEnvValue('NEXT_PUBLIC_FMZ_CONNECTED_LOGOUT_PATH', '/connected/logout'),
  connectedAdminRolesPath: getPublicEnvValue('NEXT_PUBLIC_FMZ_CONNECTED_ADMIN_ROLES_PATH', '/connected/admin-roles'),
  connectedDashboardLabel: getPublicEnvValue('NEXT_PUBLIC_FMZ_CONNECTED_DASHBOARD_LABEL', 'Início'),
  connectedAccountLabel: getPublicEnvValue('NEXT_PUBLIC_FMZ_CONNECTED_ACCOUNT_LABEL', 'Minha Conta'),
  connectedLogoutLabel: getPublicEnvValue('NEXT_PUBLIC_FMZ_CONNECTED_LOGOUT_LABEL', 'Sair da conta'),
  connectedAdminRolesLabel: getPublicEnvValue('NEXT_PUBLIC_FMZ_CONNECTED_ADMIN_ROLES_LABEL', 'Roles'),
  connectedAdminUsersPath: getPublicEnvValue('NEXT_PUBLIC_FMZ_CONNECTED_ADMIN_USERS_PATH', '/connected/admin-user-list'),
  connectedAdminPropertiesPath: getPublicEnvValue('NEXT_PUBLIC_FMZ_CONNECTED_ADMIN_PROPERTIES_PATH', '/connected/property-management'),
  connectedAdminTenantSettingsPath: getPublicEnvValue('NEXT_PUBLIC_FMZ_ADMIN_TENANT_SETTINGS_PATH', '/connected/platform-settings'),
  connectedAdminUsersLabel: getPublicEnvValue('NEXT_PUBLIC_FMZ_CONNECTED_ADMIN_USERS_LABEL', 'Usuários'),
  connectedAdminPropertiesLabel: getPublicEnvValue('NEXT_PUBLIC_FMZ_CONNECTED_ADMIN_PROPERTIES_LABEL', 'Imóveis'),
  // Neutral fallback for the connected user identity — must NOT be a brand/product
  // name. The authenticated name comes from the backend identity (or localStorage as a
  // fallback); this is only used when no name and no email are available.
  defaultConnectedUserName: getPublicEnvValue('NEXT_PUBLIC_FMZ_DEFAULT_CONNECTED_USER_NAME', 'Usuária'),
  defaultConnectedUserEmail: getPublicEnvValue('NEXT_PUBLIC_FMZ_DEFAULT_CONNECTED_USER_EMAIL', 'Conta conectada'),
  connectedUserNameStorageKey: getPublicEnvValue('NEXT_PUBLIC_FMZ_CONNECTED_USER_NAME_STORAGE_KEY', 'name'),
  connectedUserEmailStorageKey: getPublicEnvValue('NEXT_PUBLIC_FMZ_CONNECTED_USER_EMAIL_STORAGE_KEY', 'email'),
  connectedUserWalletStorageKey: getPublicEnvValue('NEXT_PUBLIC_FMZ_CONNECTED_USER_WALLET_STORAGE_KEY', 'wallet'),
  connectedUserProfileStorageKey: getPublicEnvValue('NEXT_PUBLIC_FMZ_CONNECTED_USER_PROFILE_STORAGE_KEY', 'profile'),
  instagramHandle: getPublicEnvValue('NEXT_PUBLIC_FMZ_INSTAGRAM_HANDLE', '@firmezatoken_propya'),
  instagramProfileName: getPublicEnvValue('NEXT_PUBLIC_FMZ_INSTAGRAM_PROFILE_NAME', 'FirmezaToken · Imóveis com blockchain'),
  instagramProfileUrl: getPublicEnvValue('NEXT_PUBLIC_FMZ_INSTAGRAM_PROFILE_URL', 'https://www.instagram.com/firmezatoken_propya/'),
  instagramPostsApiPath: getPublicEnvValue('NEXT_PUBLIC_FMZ_INSTAGRAM_POSTS_API_PATH', '/api/instagram/posts'),
  instagramFallbackPostCountLabel: getPublicEnvValue('NEXT_PUBLIC_FMZ_INSTAGRAM_FALLBACK_POST_COUNT_LABEL', 'Conectar'),
  instagramFallbackFollowerCountLabel: getPublicEnvValue('NEXT_PUBLIC_FMZ_INSTAGRAM_FALLBACK_FOLLOWER_COUNT_LABEL', 'Instagram'),
  instagramFallbackFollowingCountLabel: getPublicEnvValue('NEXT_PUBLIC_FMZ_INSTAGRAM_FALLBACK_FOLLOWING_COUNT_LABEL', 'Real'),
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
