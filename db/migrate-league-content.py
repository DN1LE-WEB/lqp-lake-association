"""
Parse existing league markdown content into structured weeks.
Extracts: roster, weekly results, end of year results, photos per week.
"""
import re
import os

BASE = 'C:/Users/dn1le/Documents/lqp lake/scraped-content/league'
OUTPUT = 'C:/Users/dn1le/Documents/lqp lake/db/seed-league-structured.sql'

def escape_sql(s):
    return s.replace("'", "''").strip()

league_years = {
    '2026': 1, '2025': 2, '2024': 3, '2023': 4, '2022': 5,
    '2021': 6, '2020': 7, '2019': 8, '2018': 9, '2017': 10,
    '2016': 11, '2015': 12, '2014': 13, '2013': 14,
}

sql_lines = ['-- Structured league content migration\n']

for year in sorted(league_years.keys(), reverse=True):
    md_path = f'{BASE}/league-{year}.md'
    if not os.path.exists(md_path):
        continue

    with open(md_path, 'r', encoding='utf-8') as f:
        md = f.read()

    lid = league_years[year]

    # Clean up the content - remove nav lines
    lines = md.split('\n')
    clean_lines = []
    for line in lines:
        trimmed = line.strip()
        if any(p in trimmed for p in ['[Our Mission]', '[LQP Fishing League', '[Photo Gallery]',
                '[Lac Qui Parle Walleye', '[LQPLA', '[Home]', '[Lake Association',
                'Annual (20', 'Annual (201', 'Powered by', 'weebly.com',
                '[LQP Lake "Dam', '[Youth Activities']):
            continue
        clean_lines.append(line)
    md = '\n'.join(clean_lines)

    # Fix image URLs
    md = md.replace('http://www.lqplake.org/uploads/1/8/0/2/18024505/', '/images/tournaments/')

    # Extract roster
    roster = ''
    roster_match = re.search(r'(?:League\s+)?Roster\s*\n((?:\s*\d+\..*\n?)+)', md, re.I)
    if roster_match:
        roster_text = roster_match.group(1)
        # Clean up roster entries
        entries = re.findall(r'\d+\.\s*([^\n]+)', roster_text)
        roster = '\n'.join(f'{i+1}. {e.strip()}' for i, e in enumerate(entries))

    # Extract photos
    photos = []
    for match in re.finditer(r'!\[(?:Picture)?\]\((/images/tournaments/[^\s\)]+?)(?:\?\d+)?\)', md):
        url = match.group(1)
        photos.append(url)

    # Split into weeks
    # Look for patterns like "Week #1", "Week #2", "Week \#1", etc.
    week_pattern = r'\*?\*?Week\s*\\?#?\s*(\d+)[^*\n]*\*?\*?'

    # Find all week positions
    week_positions = []
    for match in re.finditer(week_pattern, md, re.I):
        week_positions.append((match.start(), int(match.group(1)), match.group(0)))

    # Also look for "End of Year" or "Final Results"
    eoy_match = re.search(r'(Final\s+Results|End\s+of\s+(?:the\s+)?Year)', md, re.I)

    weeks = []
    for i, (pos, week_num, title) in enumerate(week_positions):
        # Get content from this week to next week (or end)
        if i + 1 < len(week_positions):
            end_pos = week_positions[i + 1][0]
        elif eoy_match and eoy_match.start() > pos:
            end_pos = eoy_match.start()
        else:
            end_pos = len(md)

        week_content = md[pos:end_pos].strip()
        # Remove the week header from content
        week_content = re.sub(r'^\*?\*?Week\s*\\?#?\s*\d+[^*\n]*\*?\*?\s*', '', week_content, flags=re.I).strip()
        # Remove markdown formatting artifacts
        week_content = week_content.strip('*').strip()

        # Extract date from week header or first line
        date = ''
        date_match = re.search(r'(\d{1,2}/\d{1,2}/\d{2,4})', title)
        if date_match:
            date = date_match.group(1)
        elif week_content:
            date_match2 = re.search(r'(\d{1,2}/\d{1,2}/\d{2,4})', week_content[:100])
            if date_match2:
                date = date_match2.group(1)

        weeks.append({
            'num': week_num,
            'title': f'Week {week_num}',
            'date': date,
            'content': week_content,
        })

    # Extract end of year results
    eoy_content = ''
    if eoy_match:
        eoy_start = eoy_match.start()
        # Get content from EOY to roster or end
        if roster_match:
            eoy_end = roster_match.start()
        else:
            eoy_end = len(md)
        eoy_content = md[eoy_start:eoy_end].strip()

    # Generate SQL
    sql_lines.append(f'\n-- League {year}')

    roster_sql = escape_sql(roster)
    eoy_sql = escape_sql(eoy_content)
    has_photos = 1 if photos else 0

    sql_lines.append(f"UPDATE fishing_league SET roster = '{roster_sql}', end_of_year_results = '{eoy_sql}', show_gallery = {has_photos} WHERE id = {lid};")

    for i, week in enumerate(weeks):
        title_sql = escape_sql(week['title'])
        date_sql = escape_sql(week['date'])
        content_sql = escape_sql(week['content'])
        sql_lines.append(f"INSERT INTO league_weeks (league_id, week_number, title, date, content, sort_order) VALUES ({lid}, {week['num']}, '{title_sql}', '{date_sql}', '{content_sql}', {i});")

    for i, url in enumerate(photos):
        url_sql = escape_sql(url)
        sql_lines.append(f"INSERT INTO league_photos (league_id, url, sort_order) VALUES ({lid}, '{url_sql}', {i});")

sql = '\n'.join(sql_lines)
with open(OUTPUT, 'w', encoding='utf-8') as f:
    f.write(sql)

print(f'Generated {OUTPUT}')
print(f'SQL statements: {len([l for l in sql_lines if l.startswith("UPDATE") or l.startswith("INSERT")])}')
