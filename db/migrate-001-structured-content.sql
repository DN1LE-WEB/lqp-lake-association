-- Add structured fields to tournaments
ALTER TABLE tournaments ADD COLUMN results_url TEXT DEFAULT '';
ALTER TABLE tournaments ADD COLUMN roster TEXT DEFAULT '';
ALTER TABLE tournaments ADD COLUMN writeup TEXT DEFAULT '';

-- Tournament photos table
CREATE TABLE IF NOT EXISTS tournament_photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tournament_id INTEGER NOT NULL,
  url TEXT NOT NULL,
  caption TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE
);

-- Add writeup to fishing league
ALTER TABLE fishing_league ADD COLUMN writeup TEXT DEFAULT '';
