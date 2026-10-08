-- Clipboard entries. One row per 6-digit code; rows are removed when they
-- expire (hourly cron), when read with burn-after-reading, or after abuse reports.
CREATE TABLE IF NOT EXISTS clips (
  code        TEXT    PRIMARY KEY,
  content     TEXT    NOT NULL,          -- plain text, or JSON ciphertext envelope when encrypted = 1
  encrypted   INTEGER NOT NULL DEFAULT 0,
  burn        INTEGER NOT NULL DEFAULT 0,
  created_at  INTEGER NOT NULL,          -- unix seconds
  expires_at  INTEGER NOT NULL,          -- unix seconds
  reports     INTEGER NOT NULL DEFAULT 0
) WITHOUT ROWID;

CREATE INDEX IF NOT EXISTS idx_clips_expires_at ON clips (expires_at);

CREATE TABLE IF NOT EXISTS reports (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  code        TEXT    NOT NULL,
  reason      TEXT,
  excerpt     TEXT,                      -- first 2,000 chars of a plain-text clip, kept for moderation
  created_at  INTEGER NOT NULL
);
