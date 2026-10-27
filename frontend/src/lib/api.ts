import type {
  CreateFeedResponse,
  EngagementActionResponse,
  FeedDetail,
  FeedListResponse,
  FeedResponse,
  FeedSummary,
  PostThreadResponse,
} from "./types";

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function apiBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not set");
  }
  return base.replace(/\/$/, "");
}

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }
  return (await response.json()) as T;
}

export async function getFeed(): Promise<FeedResponse> {
  const response = await fetch(`${apiBaseUrl()}/api/v1/feed`, {
    cache: "no-store",
  });
  return parseJson<FeedResponse>(response);
}

export async function getPostThread(postId: string): Promise<PostThreadResponse> {
  const response = await fetch(`${apiBaseUrl()}/api/v1/posts/${postId}`, {
    cache: "no-store",
  });
  if (response.status === 404) {
    throw new Error("not_found");
  }
  return parseJson<PostThreadResponse>(response);
}

export async function likePost(postId: string): Promise<EngagementActionResponse> {
  const response = await fetch(`${apiBaseUrl()}/api/v1/posts/${postId}/like`, {
    method: "POST",
    cache: "no-store",
  });
  return parseJson<EngagementActionResponse>(response);
}

export async function retweetPost(
  postId: string,
): Promise<EngagementActionResponse> {
  const response = await fetch(`${apiBaseUrl()}/api/v1/posts/${postId}/retweet`, {
    method: "POST",
    cache: "no-store",
  });
  return parseJson<EngagementActionResponse>(response);
}

async function readDetail(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { detail?: unknown };
    if (typeof body.detail === "string" && body.detail.length > 0) {
      return body.detail;
    }
  } catch {
    return `Request failed (${response.status})`;
  }
  return `Request failed (${response.status})`;
}

async function parseApi<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new ApiError(response.status, await readDetail(response));
  }
  return (await response.json()) as T;
}

export async function listHostedFeeds(): Promise<FeedSummary[]> {
  const response = await fetch(`${apiBaseUrl()}/api/v1/feeds`, {
    cache: "no-store",
  });
  const body = await parseApi<FeedListResponse>(response);
  return body.feeds;
}

export async function getHostedFeed(feedId: string): Promise<FeedDetail> {
  const response = await fetch(`${apiBaseUrl()}/api/v1/feeds/${feedId}`, {
    cache: "no-store",
  });
  return parseApi<FeedDetail>(response);
}

export async function recordFeedLoad(feedId: string): Promise<FeedDetail> {
  const response = await fetch(`${apiBaseUrl()}/api/v1/feeds/${feedId}/loads`, {
    method: "POST",
    cache: "no-store",
  });
  return parseApi<FeedDetail>(response);
}

export async function createHostedFeed(
  name: string,
  posts: string[],
): Promise<FeedSummary> {
  const response = await fetch(`${apiBaseUrl()}/api/v1/feeds`, {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, posts }),
  });
  const body = await parseApi<CreateFeedResponse>(response);
  return body.feed;
}
