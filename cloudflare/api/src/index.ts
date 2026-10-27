/**
 * Public mock feed API on a Cloudflare Worker.
 *
 * Same JSON shape as the FastAPI app:
 * GET /api/v1/feed
 * GET /api/v1/posts/{post_id}
 * POST /api/v1/posts/{post_id}/like
 * POST /api/v1/posts/{post_id}/retweet
 *
 * Counts live in D1 so a like survives the next isolate.
 */

const POST_COLUMNS = `
  p.id,
  p.text,
  p.created_at,
  p.like_count,
  p.retweet_count,
  p.reply_count,
  p.parent_post_id,
  u.id AS author_id,
  u.handle,
  u.display_name
`;

const POST_FROM = `
  FROM posts p
  JOIN users u ON u.id = p.author_id
`;

type PostRow = {
  id: string;
  text: string;
  created_at: string;
  like_count: number;
  retweet_count: number;
  reply_count: number;
  parent_post_id: string | null;
  author_id: string;
  handle: string;
  display_name: string;
};

type PostJson = {
  id: string;
  author: {
    id: string;
    handle: string;
    display_name: string;
  };
  text: string;
  created_at: string;
  engagement: {
    like_count: number;
    retweet_count: number;
    reply_count: number;
  };
  parent_post_id: string | null;
};

function log(event: string, fields: Record<string, string | number | boolean | null>): void {
  console.log(JSON.stringify({ event, ...fields }));
}

function allowedOrigins(env: Env): Set<string> {
  return new Set(
    env.CORS_ORIGINS.split(",")
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0),
  );
}

function corsHeaders(request: Request, env: Env): Headers {
  const headers = new Headers();
  const origin = request.headers.get("Origin");
  if (origin !== null && allowedOrigins(env).has(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Vary", "Origin");
    headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type");
    headers.set("Access-Control-Max-Age", "86400");
  }
  return headers;
}

function jsonResponse(
  request: Request,
  env: Env,
  status: number,
  body: unknown,
): Response {
  const headers = corsHeaders(request, env);
  headers.set("Content-Type", "application/json");
  return new Response(JSON.stringify(body), { status, headers });
}

function toPost(row: PostRow): PostJson {
  return {
    id: row.id,
    author: {
      id: row.author_id,
      handle: row.handle,
      display_name: row.display_name,
    },
    text: row.text,
    created_at: row.created_at,
    engagement: {
      like_count: row.like_count,
      retweet_count: row.retweet_count,
      reply_count: row.reply_count,
    },
    parent_post_id: row.parent_post_id,
  };
}

async function listFeed(env: Env): Promise<PostJson[]> {
  const result = await env.DB.prepare(
    `SELECT ${POST_COLUMNS} ${POST_FROM}
     WHERE p.parent_post_id IS NULL
     ORDER BY p.created_at DESC`,
  ).all<PostRow>();
  return (result.results ?? []).map(toPost);
}

async function getPost(env: Env, postId: string): Promise<PostJson | null> {
  const row = await env.DB.prepare(
    `SELECT ${POST_COLUMNS} ${POST_FROM} WHERE p.id = ?`,
  )
    .bind(postId)
    .first<PostRow>();
  return row === null ? null : toPost(row);
}

async function listComments(env: Env, postId: string): Promise<PostJson[]> {
  const result = await env.DB.prepare(
    `SELECT ${POST_COLUMNS} ${POST_FROM}
     WHERE p.parent_post_id = ?
     ORDER BY p.created_at ASC`,
  )
    .bind(postId)
    .all<PostRow>();
  return (result.results ?? []).map(toPost);
}

async function incrementColumn(
  env: Env,
  postId: string,
  sql: string,
): Promise<PostJson | null> {
  const updated = await env.DB.prepare(sql).bind(postId).run();
  if ((updated.meta.changes ?? 0) === 0) {
    return null;
  }
  return getPost(env, postId);
}

function notFound(request: Request, env: Env): Response {
  return jsonResponse(request, env, 404, { detail: "Post not found" });
}

function postIdFrom(match: RegExpMatchArray): string | null {
  try {
    const postId = decodeURIComponent(match[1]);
    return postId.length > 0 ? postId : null;
  } catch {
    return null;
  }
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

  const postMatch = pathname.match(/^\/api\/v1\/posts\/([^/]+)$/);
  if (postMatch !== null && request.method === "GET") {
    const postId = postIdFrom(postMatch);
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
    const postId = postIdFrom(likeMatch);
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
    const postId = postIdFrom(retweetMatch);
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
