"""
Parse scraped tournament and league content and generate SQL seed statements.
Extracts: writeup text, results URLs, roster, photo URLs with captions.
"""
import os
import re

BASE = 'C:/Users/dn1le/Documents/lqp lake/scraped-content'
OUTPUT = 'C:/Users/dn1le/Documents/lqp lake/db/seed-content.sql'

def escape_sql(s):
    return s.replace("'", "''").strip()

def extract_results_url(md):
    """Find Google Sheets or download links for results."""
    patterns = [
        r'https://docs\.google\.com/spreadsheets/[^\s\)\"]+',
        r'http://www\.lqplake\.org/uploads/[^\s\)\"]+\.xlsx',
        r'http://www\.lqplake\.org/uploads/[^\s\)\"]+results[^\s\)\"]*',
    ]
    for pat in patterns:
        match = re.search(pat, md)
        if match:
            return match.group(0)
    return ''

def extract_images_with_captions(md):
    """Extract image URLs and their captions from markdown."""
    photos = []
    lines = md.split('\n')
    for i, line in enumerate(lines):
        img_matches = re.findall(r'!\[([^\]]*)\]\(([^\)]+)\)', line)
        for alt, url in img_matches:
            if 'lqplake.org/uploads' in url or '/images/' in url:
                # Get the filename
                fname = url.split('/')[-1].split('?')[0]
                # Look for caption in next line
                caption = alt if alt and alt != 'Picture' and alt != '' else ''
                if not caption and i + 1 < len(lines):
                    next_line = lines[i + 1].strip()
                    if next_line and not next_line.startswith('!') and not next_line.startswith('[') and not next_line.startswith('#') and not next_line.startswith('-') and not next_line.startswith('|'):
                        caption = next_line.strip('*_')
                photos.append((fname, caption))

        # Also check for linked images [![](url)](url)
        linked_matches = re.findall(r'\[!\[[^\]]*\]\(([^\)]+)\)\]\(([^\)]+)\)', line)
        for thumb, full in linked_matches:
            fname = full.split('/')[-1].split('?')[0]
            if fname not in [p[0] for p in photos]:
                photos.append((fname, ''))

    return photos

def extract_writeup(md):
    """Extract the main text content (not images, not nav)."""
    lines = md.split('\n')
    writeup_lines = []
    for line in lines:
        stripped = line.strip()
        # Skip image lines
        if stripped.startswith('![') or stripped.startswith('[!['):
            continue
        # Skip empty lines at start
        if not writeup_lines and not stripped:
            continue
        # Skip headers that are just the tournament title
        if stripped.startswith('#') and ('Annual' in stripped or 'LQP' in stripped):
            continue
        # Skip links-only lines
        if stripped.startswith('[') and stripped.endswith(')'):
            continue
        if stripped.startswith('_[') or stripped.startswith('_​['):
            continue
        # Skip empty unicode chars
        if stripped in ['​', '_​_', '​​ ​', '_[​](']:
            continue
        if stripped:
            # Clean up markdown bold
            clean = stripped.replace('**', '').replace('__', '').strip('_').strip()
            if clean and len(clean) > 3:
                writeup_lines.append(clean)

    return '\n'.join(writeup_lines)

def extract_roster(md):
    """Extract roster list from tournament page."""
    lines = md.split('\n')
    roster_lines = []
    in_roster = False
    for line in lines:
        if 'Roster' in line or 'roster' in line:
            in_roster = True
            # Check if roster is in the same line
            parts = line.split(')')
            if len(parts) > 1:
                rest = parts[-1].strip()
                if rest:
                    roster_lines.append(rest)
            continue
        if in_roster:
            stripped = line.strip()
            if not stripped or stripped.startswith('!') or stripped.startswith('[') or stripped.startswith('_'):
                if roster_lines:
                    break
                continue
            # Numbered entries like "1.  Name & Name"
            if re.match(r'\d+\.', stripped):
                roster_lines.append(stripped)
            elif '&' in stripped:
                roster_lines.append(stripped)

    return '\n'.join(roster_lines)

# Generate SQL
sql_lines = []
sql_lines.append("-- Auto-generated from scraped content\n")

# Tournament year to DB id mapping (from seed order: 46th=1, 45th=2, etc.)
tournament_years = {
    '2026': 1, '2025': 2, '2024': 3, '2023': 4, '2022': 5,
    '2021': 6, '2020': 7, '2019': 8, '2018': 9, '2017': 10,
    '2016': 11, '2015': 12, '2014': 13, '2013': 14, '2012': 15,
}

league_years = {
    '2026': 1, '2025': 2, '2024': 3, '2023': 4, '2022': 5,
    '2021': 6, '2020': 7, '2019': 8, '2018': 9, '2017': 10,
    '2016': 11, '2015': 12, '2014': 13, '2013': 14,
}

# Process tournaments
total_photos = 0
for year in sorted(tournament_years.keys(), reverse=True):
    md_path = f'{BASE}/tournaments/tournament-{year}.md'
    if not os.path.exists(md_path):
        continue

    with open(md_path, 'r', encoding='utf-8') as f:
        md = f.read()

    tid = tournament_years[year]
    results_url = escape_sql(extract_results_url(md))
    writeup = escape_sql(extract_writeup(md))
    roster = escape_sql(extract_roster(md))
    photos = extract_images_with_captions(md)

    sql_lines.append(f"\n-- Tournament {year}")
    sql_lines.append(f"UPDATE tournaments SET results_url = '{results_url}', writeup = '{writeup}', roster = '{roster}' WHERE id = {tid};")

    for i, (fname, caption) in enumerate(photos):
        caption_sql = escape_sql(caption)
        sql_lines.append(f"INSERT INTO tournament_photos (tournament_id, url, caption, sort_order) VALUES ({tid}, '/images/tournaments/{fname}', '{caption_sql}', {i});")
        total_photos += 1

# Process leagues
for year in sorted(league_years.keys(), reverse=True):
    md_path = f'{BASE}/league/league-{year}.md'
    if not os.path.exists(md_path):
        continue

    with open(md_path, 'r', encoding='utf-8') as f:
        md = f.read()

    lid = league_years[year]
    results_url = escape_sql(extract_results_url(md))
    writeup = escape_sql(extract_writeup(md))

    sql_lines.append(f"\n-- League {year}")
    if results_url:
        sql_lines.append(f"UPDATE fishing_league SET results_url = '{results_url}', writeup = '{writeup}' WHERE id = {lid};")
    else:
        sql_lines.append(f"UPDATE fishing_league SET writeup = '{writeup}' WHERE id = {lid};")

sql = '\n'.join(sql_lines)
with open(OUTPUT, 'w', encoding='utf-8') as f:
    f.write(sql)

print(f"Generated {OUTPUT}")
print(f"Tournament photos: {total_photos}")
print(f"SQL statements: {len([l for l in sql_lines if l.startswith('UPDATE') or l.startswith('INSERT')])}")
