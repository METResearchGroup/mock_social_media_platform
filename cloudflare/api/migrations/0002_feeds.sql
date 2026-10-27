-- Ordered feeds of post identifiers.
-- feed_items.post_ref is the caller-supplied identifier. It may match posts.id.
-- It may also be any other string, including an at:// URI that is not in posts.
-- Those unknown identifiers are stored and returned as-is. The UI shows a placeholder.

CREATE TABLE feeds (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  load_count INTEGER NOT NULL DEFAULT 0 CHECK (load_count >= 0),
  last_loaded_at TEXT
);

CREATE TABLE feed_items (
  feed_id TEXT NOT NULL REFERENCES feeds (id),
  position INTEGER NOT NULL CHECK (position >= 0),
  post_ref TEXT NOT NULL,
  PRIMARY KEY (feed_id, position)
);
