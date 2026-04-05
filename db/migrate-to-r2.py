"""
Upload all local images to R2 bucket via wrangler and generate SQL to update URLs.
"""
import os
import subprocess
import json

IMAGE_DIR = 'C:/Users/dn1le/Documents/lqp lake/public/images'
SQL_OUTPUT = 'C:/Users/dn1le/Documents/lqp lake/db/migrate-004-r2-urls.sql'

def escape_sql(s):
    return s.replace("'", "''")

# Collect all image files
files = []
for root, dirs, filenames in os.walk(IMAGE_DIR):
    for fname in filenames:
        filepath = os.path.join(root, fname)
        # Get relative path from public/
        rel_path = os.path.relpath(filepath, 'C:/Users/dn1le/Documents/lqp lake/public').replace('\\', '/')
        # R2 key
        r2_key = f'uploads/{fname}'
        # Old URL (as stored in DB and pages)
        old_url = f'/{rel_path}'
        # New URL via our media API
        new_url = f'/api/media/uploads/{fname}'
        files.append({
            'filepath': filepath,
            'r2_key': r2_key,
            'old_url': old_url,
            'new_url': new_url,
            'fname': fname,
        })

print(f'Found {len(files)} files to upload')

# Upload to R2 using wrangler
uploaded = 0
failed = 0

for i, f in enumerate(files):
    result = subprocess.run(
        ['npx', 'wrangler', 'r2', 'object', 'put',
         f'lqp-lake-uploads/{f["r2_key"]}',
         '--file', f['filepath']],
        capture_output=True, text=True, timeout=30
    )
    if result.returncode == 0:
        uploaded += 1
    else:
        failed += 1
        print(f'  FAIL: {f["fname"]}: {result.stderr[:100]}')

    if (i + 1) % 50 == 0:
        print(f'  Progress: {i + 1}/{len(files)} (uploaded: {uploaded}, failed: {failed})')

print(f'\nUpload complete: {uploaded} uploaded, {failed} failed')

# Generate SQL to update all URL references
sql_lines = ['-- Update image URLs from static paths to R2 API paths\n']

# Update tournament_photos
sql_lines.append("UPDATE tournament_photos SET url = '/api/media/uploads/' || SUBSTR(url, INSTR(url, '/', 2) + 1) WHERE url LIKE '/images/%';")
sql_lines.append("UPDATE tournament_photos SET url = REPLACE(url, '/api/media/uploads/tournaments/', '/api/media/uploads/') WHERE url LIKE '%/tournaments/%';")
sql_lines.append("UPDATE tournament_photos SET url = REPLACE(url, '/api/media/uploads/original/', '/api/media/uploads/') WHERE url LIKE '%/original/%';")

# Update league_photos
sql_lines.append("UPDATE league_photos SET url = '/api/media/uploads/' || SUBSTR(url, INSTR(url, '/', 2) + 1) WHERE url LIKE '/images/%';")
sql_lines.append("UPDATE league_photos SET url = REPLACE(url, '/api/media/uploads/tournaments/', '/api/media/uploads/') WHERE url LIKE '%/tournaments/%';")
sql_lines.append("UPDATE league_photos SET url = REPLACE(url, '/api/media/uploads/original/', '/api/media/uploads/') WHERE url LIKE '%/original/%';")

# Update gallery_photos
sql_lines.append("UPDATE gallery_photos SET url = '/api/media/uploads/' || SUBSTR(url, INSTR(url, '/', 2) + 1) WHERE url LIKE '/images/%';")
sql_lines.append("UPDATE gallery_photos SET url = REPLACE(url, '/api/media/uploads/tournaments/', '/api/media/uploads/') WHERE url LIKE '%/tournaments/%';")
sql_lines.append("UPDATE gallery_photos SET url = REPLACE(url, '/api/media/uploads/original/', '/api/media/uploads/') WHERE url LIKE '%/original/%';")

# Update news image_url
sql_lines.append("UPDATE news SET image_url = '/api/media/uploads/' || SUBSTR(image_url, INSTR(image_url, '/', 2) + 1) WHERE image_url LIKE '/images/%';")
sql_lines.append("UPDATE news SET image_url = REPLACE(image_url, '/api/media/uploads/tournaments/', '/api/media/uploads/') WHERE image_url LIKE '%/tournaments/%';")
sql_lines.append("UPDATE news SET image_url = REPLACE(image_url, '/api/media/uploads/original/', '/api/media/uploads/') WHERE image_url LIKE '%/original/%';")

# Update content fields that have inline image references
for table in ['tournaments', 'fishing_league', 'pages', 'sections', 'news', 'league_weeks']:
    sql_lines.append(f"UPDATE {table} SET content = REPLACE(content, '/images/tournaments/', '/api/media/uploads/') WHERE content LIKE '%/images/tournaments/%';")
    sql_lines.append(f"UPDATE {table} SET content = REPLACE(content, '/images/original/', '/api/media/uploads/') WHERE content LIKE '%/images/original/%';")

# Update fishing_league end_of_year_results
sql_lines.append("UPDATE fishing_league SET end_of_year_results = REPLACE(end_of_year_results, '/images/tournaments/', '/api/media/uploads/') WHERE end_of_year_results LIKE '%/images/tournaments/%';")

with open(SQL_OUTPUT, 'w', encoding='utf-8') as f:
    f.write('\n'.join(sql_lines))

print(f'Generated {SQL_OUTPUT}')
