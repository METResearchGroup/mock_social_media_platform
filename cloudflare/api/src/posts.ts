export const POST_COLUMNS = `
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

export const POST_FROM = `
  FROM posts p
  JOIN users u ON u.id = p.author_id
`;

export type PostRow = {
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

export type PostJson = {
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

export function toPost(row: PostRow): PostJson {
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

export async function listFeed(env: Env): Promise<PostJson[]> {
  // The home timeline stays on the seed authors. Sample posts are served by id
  // from a named feed, so this query does not return the 40,000 study rows.
  const result = await env.DB.prepare(
    `SELECT ${POST_COLUMNS} ${POST_FROM}
     WHERE p.parent_post_id IS NULL
       AND p.author_id IN ('user_ada', 'user_grace', 'user_alan')
     ORDER BY p.created_at DESC`,
  ).all<PostRow>();
  return (result.results ?? []).map(toPost);
}

export async function getPost(env: Env, postId: string): Promise<PostJson | null> {
  const row = await env.DB.prepare(
    `SELECT ${POST_COLUMNS} ${POST_FROM} WHERE p.id = ?`,
  )
    .bind(postId)
    .first<PostRow>();
  return row === null ? null : toPost(row);
}

export async function listComments(env: Env, postId: string): Promise<PostJson[]> {
  const result = await env.DB.prepare(
    `SELECT ${POST_COLUMNS} ${POST_FROM}
     WHERE p.parent_post_id = ?
     ORDER BY p.created_at ASC`,
  )
    .bind(postId)
    .all<PostRow>();
  return (result.results ?? []).map(toPost);
}

export async function incrementColumn(
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
