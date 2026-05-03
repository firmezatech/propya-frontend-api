export type FmzInstagramPost = {
  id: string;
  caption: string;
  imageUrl: string;
  permalink: string;
  likeCount: number;
  commentsCount: number;
};

export type FmzInstagramProfileStats = {
  posts: string;
  followers: string;
  following: string;
};

export type FmzInstagramFeedResponse = {
  posts: FmzInstagramPost[];
  stats: FmzInstagramProfileStats;
  source: 'instagram-api' | 'fallback';
};
