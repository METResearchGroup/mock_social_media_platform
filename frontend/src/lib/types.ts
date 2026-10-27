export type EngagementMetrics = {
  like_count: number;
  retweet_count: number;
  reply_count: number;
};

export type UserSummary = {
  id: string;
  handle: string;
  display_name: string;
};

export type Post = {
  id: string;
  author: UserSummary;
  text: string;
  created_at: string;
  engagement: EngagementMetrics;
  parent_post_id: string | null;
};

export type FeedResponse = {
  posts: Post[];
};

export type PostThreadResponse = {
  post: Post;
  comments: Post[];
};

export type EngagementActionResponse = {
  post: Post;
};

export type FeedSummary = {
  id: string;
  name: string;
  created_at: string;
  load_count: number;
  last_loaded_at: string | null;
  post_count: number;
};

export type HostedFeedItem = {
  ref: string;
  status: "known" | "unknown";
  post: Post | null;
};

export type FeedDetail = {
  feed: FeedSummary;
  posts: HostedFeedItem[];
};

export type FeedListResponse = {
  feeds: FeedSummary[];
};

export type CreateFeedResponse = {
  feed: FeedSummary;
};
