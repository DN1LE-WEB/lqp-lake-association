#!/usr/bin/env python3
"""
Read scraped markdown files and generate SQL UPDATE statements
to store the FULL markdown content in the D1 writeup field.
"""

import os
import re

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Tournament IDs: 2026=1, 2025=2, ..., 2012=15
TOURNAMENT_IDS = {2026: 1, 2025: 2, 2024: 3, 2023: 4, 2022: 5, 2021: 6,
                  2020: 7, 2019: 8, 2018: 9, 2017: 10, 2016: 11, 2015: 12,
                  2014: 13, 2013: 14, 2012: 15}

# League IDs: 2026=1, 2025=2, ..., 2013=14
LEAGUE_IDS = {2026: 1, 2025: 2, 2024: 3, 2023: 4, 2022: 5, 2021: 6,
              2020: 7, 2019: 8, 2018: 9, 2017: 10, 2016: 11, 2015: 12,
              2014: 13, 2013: 14}


def escape_sql(text):
    """Escape single quotes for SQL strings."""
    return text.replace("'", "''")


def read_file(path):
    """Read file content, return None if not found."""
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return f.read()
    except FileNotFoundError:
        return None


def main():
    sql_lines = ["-- Auto-generated: full markdown content for writeup fields\n"]

    # Tournament updates
    sql_lines.append("-- === TOURNAMENTS ===\n")
    for year in sorted(TOURNAMENT_IDS.keys(), reverse=True):
        tid = TOURNAMENT_IDS[year]
        path = os.path.join(BASE_DIR, "scraped-content", "tournaments", f"tournament-{year}.md")
        content = read_file(path)
        if content is None:
            sql_lines.append(f"-- tournament-{year}.md not found, skipping\n")
            continue
        escaped = escape_sql(content.strip())
        sql_lines.append(f"-- Tournament {year} (id={tid})")
        sql_lines.append(f"UPDATE tournaments SET writeup = '{escaped}' WHERE id = {tid};\n")

    # League updates
    sql_lines.append("\n-- === FISHING LEAGUE ===\n")
    for year in sorted(LEAGUE_IDS.keys(), reverse=True):
        lid = LEAGUE_IDS[year]
        path = os.path.join(BASE_DIR, "scraped-content", "league", f"league-{year}.md")
        content = read_file(path)
        if content is None:
            sql_lines.append(f"-- league-{year}.md not found, skipping\n")
            continue
        escaped = escape_sql(content.strip())
        sql_lines.append(f"-- League {year} (id={lid})")
        sql_lines.append(f"UPDATE fishing_league SET writeup = '{escaped}' WHERE id = {lid};\n")

    out_path = os.path.join(BASE_DIR, "db", "seed-full-content.sql")
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(sql_lines))

    print(f"Written to {out_path}")
    print(f"Total lines: {len(sql_lines)}")


if __name__ == '__main__':
    main()
