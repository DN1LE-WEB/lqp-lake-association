-- Structured league content

-- Add roster and show_gallery fields to fishing_league
ALTER TABLE fishing_league ADD COLUMN roster TEXT DEFAULT '';
ALTER TABLE fishing_league ADD COLUMN show_gallery INTEGER DEFAULT 0;
ALTER TABLE fishing_league ADD COLUMN end_of_year_results TEXT DEFAULT '';

-- Weekly results for each league season
CREATE TABLE IF NOT EXISTS league_weeks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  league_id INTEGER NOT NULL,
  week_number INTEGER NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  date TEXT DEFAULT '',
  content TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  FOREIGN KEY (league_id) REFERENCES fishing_league(id) ON DELETE CASCADE
);

-- League photos (per-week or per-season)
CREATE TABLE IF NOT EXISTS league_photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  league_id INTEGER NOT NULL,
  week_id INTEGER,
  url TEXT NOT NULL,
  caption TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  FOREIGN KEY (league_id) REFERENCES fishing_league(id) ON DELETE CASCADE,
  FOREIGN KEY (week_id) REFERENCES league_weeks(id) ON DELETE SET NULL
);
