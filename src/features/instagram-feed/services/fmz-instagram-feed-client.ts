import { fmzInstagramFallbackPosts, fmzInstagramFeedConfig } from '../fmz-instagram-feed.config';
import type { FmzInstagramFeedResponse } from '../domain/fmz-instagram-feed.types';

const fallbackFeed: FmzInstagramFeedResponse = {
  posts: [...fmzInstagramFallbackPosts],
  stats: fmzInstagramFeedConfig.stats,
  source: 'fallback',
};

export async function fetchFmzInstagramFeed(): Promise<FmzInstagramFeedResponse> {
  try {
    const response = await fetch(fmzInstagramFeedConfig.apiPath, { cache: 'no-store' });
    if (!response.ok) return fallbackFeed;
    const feed = (await response.json()) as FmzInstagramFeedResponse;
    return feed.posts.length > 0 ? feed : fallbackFeed;
  } catch {
    return fallbackFeed;
  }
}
