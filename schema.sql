-- clayday · Cloudflare D1 schema
CREATE TABLE IF NOT EXISTS users (
  id           TEXT PRIMARY KEY,
  email        TEXT NOT NULL UNIQUE,
  name         TEXT NOT NULL,
  role         TEXT NOT NULL DEFAULT 'user',   -- 'admin' | 'user'
  pw_hash      TEXT NOT NULL,
  failed_count INTEGER NOT NULL DEFAULT 0,
  locked_until INTEGER NOT NULL DEFAULT 0,
  created_at   INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  id         TEXT PRIMARY KEY,           -- SHA-256 of the cookie token
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_exp  ON sessions(expires_at);
CREATE TABLE IF NOT EXISTS user_data (
  user_id    TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  json       TEXT NOT NULL,
  rev        INTEGER NOT NULL DEFAULT 1,
  updated_at INTEGER NOT NULL
);
