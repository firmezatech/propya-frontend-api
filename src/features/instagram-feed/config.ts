import { fmzPublicLayoutConfig } from '../../config/fmz-public-layout-config';
import type { FmzInstagramPost } from './domain/fmz-instagram-feed.types';

const getPublicEnvValue = (key: string, fallback: string): string => {
  const value = process.env[key];
  return value && value.trim().length > 0 ? value.trim() : fallback;
};

const instagramProfileUrl = fmzPublicLayoutConfig.instagramProfileUrl;

export const fmzInstagramFeedConfig = {
  handle: fmzPublicLayoutConfig.instagramHandle,
  profileName: fmzPublicLayoutConfig.instagramProfileName,
  profileUrl: instagramProfileUrl,
  apiPath: fmzPublicLayoutConfig.instagramPostsApiPath,
  stats: {
    posts: fmzPublicLayoutConfig.instagramFallbackPostCountLabel,
    followers: fmzPublicLayoutConfig.instagramFallbackFollowerCountLabel,
    following: fmzPublicLayoutConfig.instagramFallbackFollowingCountLabel,
  },
  defaultImageUrl: getPublicEnvValue('NEXT_PUBLIC_FMZ_INSTAGRAM_DEFAULT_IMAGE_URL', '/banner-tokens.jpeg'),
} as const;

export const fmzInstagramFallbackPosts: readonly FmzInstagramPost[] = [
  {
    id: 'fallback-tokenizacao',
    caption: getPublicEnvValue('NEXT_PUBLIC_FMZ_INSTAGRAM_FALLBACK_CAPTION_1', 'Conecte o Instagram oficial para exibir os posts reais da FirmezaToken.'),
    imageUrl: getPublicEnvValue('NEXT_PUBLIC_FMZ_INSTAGRAM_FALLBACK_IMAGE_1', fmzInstagramFeedConfig.defaultImageUrl),
    permalink: instagramProfileUrl,
    likeCount: 0,
    commentsCount: 0,
  },
  {
    id: 'fallback-blockchain',
    caption: getPublicEnvValue('NEXT_PUBLIC_FMZ_INSTAGRAM_FALLBACK_CAPTION_2', 'Use um token do Instagram Graph API no ambiente para ativar o feed real.'),
    imageUrl: getPublicEnvValue('NEXT_PUBLIC_FMZ_INSTAGRAM_FALLBACK_IMAGE_2', fmzInstagramFeedConfig.defaultImageUrl),
    permalink: instagramProfileUrl,
    likeCount: 0,
    commentsCount: 0,
  },
] as const;
