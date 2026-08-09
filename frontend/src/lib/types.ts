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
