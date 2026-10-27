/**
 * Public mock feed API on a Cloudflare Worker.
 *
 * Existing JSON routes:
 * GET /api/v1/feed
 * GET /api/v1/posts/{post_id}
 * POST /api/v1/posts/{post_id}/like
 * POST /api/v1/posts/{post_id}/retweet
 *
 * Hosted feeds:
 * POST /api/v1/feeds
 * GET /api/v1/feeds
 * GET /api/v1/feeds/{feed_id}
 * POST /api/v1/feeds/{feed_id}/loads
 * GET /xrpc/app.bsky.feed.getFeedSkeleton?feed={feed_id}&limit=&cursor=
 *
 * getFeedSkeleton returns { feed: [{ post }], cursor? }.
 * cursor is the next offset. It is omitted on the last page.
 * Unknown identifiers are stored and returned unchanged.
 * A public page load is the only call that increments load_count.
 */

import {
  handleCreateFeed,
  handleGetFeed,
  handleGetFeedSkeleton,
  handleListFeeds,
  handleRecordLoad,
} from "./feeds";
import { corsHeaders, decodePathPart, jsonResponse } from "./http";
import { getPost, incrementColumn, listComments, listFeed } from "./posts";

function log(event: string, fields: Record<string, string | number | boolean | null>): void {
  console.log(JSON.stringify({ event, ...fields }));
}

function notFound(request: Request, env: Env): Response {
  return jsonResponse(request, env, 404, { detail: "Post not found" });
}

function methodNotAllowed(request: Request, env: Env): Response {
  return jsonResponse(request, env, 405, { detail: "Method not allowed" });
}

async function route(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const { pathname } = url;

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request, env) });
  }

  if (request.method === "GET" && pathname === "/health") {
    return jsonResponse(request, env, 200, { status: "ok" });
  }

  if (request.method === "GET" && pathname === "/api/v1/feed") {
    return jsonResponse(request, env, 200, { posts: await listFeed(env) });
  }

  if (pathname === "/xrpc/app.bsky.feed.getFeedSkeleton") {
    if (request.method !== "GET") {
      return methodNotAllowed(request, env);
    }
    return handleGetFeedSkeleton(request, env);
  }

  if (pathname === "/api/v1/feeds") {
    if (request.method === "GET") {
      return handleListFeeds(request, env);
    }
    if (request.method === "POST") {
      return handleCreateFeed(request, env);
    }
    return methodNotAllowed(request, env);
  }

  if (/^\/api\/v1\/feeds\/[^/]+\/loads$/.test(pathname)) {
    if (request.method !== "POST") {
      return methodNotAllowed(request, env);
    }
    return handleRecordLoad(request, env);
  }

  if (/^\/api\/v1\/feeds\/[^/]+$/.test(pathname)) {
    if (request.method !== "GET") {
      return methodNotAllowed(request, env);
    }
    return handleGetFeed(request, env);
  }

  const postMatch = pathname.match(/^\/api\/v1\/posts\/([^/]+)$/);
  if (postMatch !== null && request.method === "GET") {
    const postId = decodePathPart(postMatch[1] ?? "");
    if (postId === null) {
      return notFound(request, env);
    }
    const post = await getPost(env, postId);
    if (post === null) {
      return notFound(request, env);
    }
    return jsonResponse(request, env, 200, {
      post,
      comments: await listComments(env, postId),
    });
  }

  const likeMatch = pathname.match(/^\/api\/v1\/posts\/([^/]+)\/like$/);
  if (likeMatch !== null && request.method === "POST") {
    const postId = decodePathPart(likeMatch[1] ?? "");
    if (postId === null) {
      return notFound(request, env);
    }
    const post = await incrementColumn(
      env,
      postId,
      "UPDATE posts SET like_count = like_count + 1 WHERE id = ?",
    );
    if (post === null) {
      return notFound(request, env);
    }
    return jsonResponse(request, env, 200, { post });
  }

  const retweetMatch = pathname.match(/^\/api\/v1\/posts\/([^/]+)\/retweet$/);
  if (retweetMatch !== null && request.method === "POST") {
    const postId = decodePathPart(retweetMatch[1] ?? "");
    if (postId === null) {
      return notFound(request, env);
    }
    const post = await incrementColumn(
      env,
      postId,
      "UPDATE posts SET retweet_count = retweet_count + 1 WHERE id = ?",
    );
    if (post === null) {
      return notFound(request, env);
    }
    return jsonResponse(request, env, 200, { post });
  }

  return jsonResponse(request, env, 404, { detail: "Not found" });
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);
    const started = Date.now();
    try {
      const response = await route(request, env);
      log("request", {
        method: request.method,
        path: url.pathname,
        status: response.status,
        duration_ms: Date.now() - started,
      });
      return response;
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error";
      console.error(
        JSON.stringify({
          event: "request_failed",
          method: request.method,
          path: url.pathname,
          message,
        }),
      );
      return jsonResponse(request, env, 500, { detail: "Internal server error" });
    }
  },
} satisfies ExportedHandler<Env>;
