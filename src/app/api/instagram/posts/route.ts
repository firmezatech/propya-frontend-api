import { NextResponse } from 'next/server';
import { fmzInstagramFallbackPosts, fmzInstagramFeedConfig } from '../../../../features/instagram-feed/fmz-instagram-feed.config';
import type { FmzInstagramFeedResponse, FmzInstagramPost } from '../../../../features/instagram-feed/domain/fmz-instagram-feed.types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const INSTAGRAM_GRAPH_BASE_URL = process.env.FMZ_INSTAGRAM_GRAPH_BASE_URL || 'https://graph.instagram.com';
const INSTAGRAM_USER_ID = process.env.FMZ_INSTAGRAM_USER_ID || 'me';
const INSTAGRAM_ACCESS_TOKEN = process.env.FMZ_INSTAGRAM_ACCESS_TOKEN;
const INSTAGRAM_POST_LIMIT = Number(process.env.FMZ_INSTAGRAM_POST_LIMIT || '12');

const fallbackFeed: FmzInstagramFeedResponse = {
  posts: [...fmzInstagramFallbackPosts],
  stats: fmzInstagramFeedConfig.stats,
  source: 'fallback',
};

type InstagramGraphMediaItem = {
  id: string;
  caption?: string;
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  like_count?: number;
  comments_count?: number;
};

type InstagramGraphResponse = {
  data?: InstagramGraphMediaItem[];
};

const buildInstagramMediaUrl = (): string => {
  const searchParams = new URLSearchParams({
    fields: 'id,caption,media_url,thumbnail_url,permalink,like_count,comments_count',
    limit: String(INSTAGRAM_POST_LIMIT),
    access_token: INSTAGRAM_ACCESS_TOKEN || '',
  });

  return `${INSTAGRAM_GRAPH_BASE_URL}/${INSTAGRAM_USER_ID}/media?${searchParams.toString()}`;
};

const mapInstagramPost = (post: InstagramGraphMediaItem): FmzInstagramPost | null => {
  const imageUrl = post.media_url || post.thumbnail_url;
  if (!post.id || !imageUrl) return null;

  return {
    id: post.id,
    caption: post.caption || '',
    imageUrl,
    permalink: post.permalink || fmzInstagramFeedConfig.profileUrl,
    likeCount: post.like_count || 0,
    commentsCount: post.comments_count || 0,
  };
};

export async function GET() {
  if (!INSTAGRAM_ACCESS_TOKEN) {
    return NextResponse.json(fallbackFeed);
  }

  try {
    const response = await fetch(buildInstagramMediaUrl(), { cache: 'no-store' });
    if (!response.ok) return NextResponse.json(fallbackFeed);

    const instagramFeed = (await response.json()) as InstagramGraphResponse;
    const posts = (instagramFeed.data || []).map(mapInstagramPost).filter((post): post is FmzInstagramPost => Boolean(post));

    return NextResponse.json({
      posts,
      stats: fmzInstagramFeedConfig.stats,
      source: posts.length > 0 ? 'instagram-api' : 'fallback',
    } satisfies FmzInstagramFeedResponse);
  } catch {
    return NextResponse.json(fallbackFeed);
  }
}
