CREATE TABLE users (
  id TEXT PRIMARY KEY,
  handle TEXT NOT NULL,
  display_name TEXT NOT NULL
);

CREATE TABLE posts (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL REFERENCES users (id),
  text TEXT NOT NULL,
  created_at TEXT NOT NULL,
  like_count INTEGER NOT NULL CHECK (like_count >= 0),
  retweet_count INTEGER NOT NULL CHECK (retweet_count >= 0),
  reply_count INTEGER NOT NULL CHECK (reply_count >= 0),
  parent_post_id TEXT REFERENCES posts (id)
);

CREATE INDEX posts_parent_created ON posts (parent_post_id, created_at);

INSERT INTO users (id, handle, display_name) VALUES
  ('user_ada', 'ada', 'Ada Lovelace'),
  ('user_grace', 'grace', 'Grace Hopper'),
  ('user_alan', 'alan', 'Alan Turing');

INSERT INTO posts (
  id,
  author_id,
  text,
  created_at,
  like_count,
  retweet_count,
  reply_count,
  parent_post_id
) VALUES
  (
    'post_1',
    'user_ada',
    'Notes from building the analytical engine.',
    '2026-08-09T12:00:00Z',
    12,
    3,
    3,
    NULL
  ),
  (
    'post_2',
    'user_grace',
    'Debugging is twice as hard as writing the code.',
    '2026-08-09T11:30:00Z',
    40,
    11,
    0,
    NULL
  ),
  (
    'post_3',
    'user_alan',
    'Machines can surprise their makers.',
    '2026-08-09T11:00:00Z',
    22,
    5,
    1,
    NULL
  ),
  (
    'post_4',
    'user_ada',
    'Poetry and mathematics share a love of pattern.',
    '2026-08-09T10:15:00Z',
    8,
    1,
    0,
    NULL
  ),
  (
    'post_5',
    'user_grace',
    'Ship the compiler, then teach the operators.',
    '2026-08-09T09:45:00Z',
    15,
    4,
    0,
    NULL
  ),
  (
    'comment_1a',
    'user_grace',
    'Would love a walkthrough of the punched cards.',
    '2026-08-09T12:05:00Z',
    2,
    0,
    0,
    'post_1'
  ),
  (
    'comment_1b',
    'user_alan',
    'The sequencing notes are especially clear.',
    '2026-08-09T12:10:00Z',
    1,
    0,
    0,
    'post_1'
  ),
  (
    'comment_1c',
    'user_ada',
    'Happy to share the next draft tomorrow.',
    '2026-08-09T12:20:00Z',
    4,
    1,
    0,
    'post_1'
  ),
  (
    'comment_3a',
    'user_ada',
    'Surprise is a useful research signal.',
    '2026-08-09T11:10:00Z',
    3,
    0,
    0,
    'post_3'
  );
