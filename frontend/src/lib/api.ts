import type {
  EngagementActionResponse,
  FeedResponse,
  PostThreadResponse,
} from "./types";

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
