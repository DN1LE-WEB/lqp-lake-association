#!/bin/bash
API_KEY=$(cat "C:/Users/dn1le/Documents/lqp lake/.firecrawl_key")
BASE="C:/Users/dn1le/Documents/lqp lake/scraped-content"
TOTAL_IMAGES=0
TOTAL_PAGES=0

scrape_page() {
    local url="$1"
    local outdir="$2"
    local fname="$3"

    echo "Scraping: $fname"

    local raw=$(curl -s -X POST https://api.firecrawl.dev/v1/scrape \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $API_KEY" \
        -d "{\"url\":\"$url\",\"formats\":[\"markdown\"]}")

    local success=$(echo "$raw" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('success',''))" 2>/dev/null)

    if [ "$success" != "True" ]; then
        echo "  FAILED: $url"
        return
    fi

    # Extract markdown and process with python
    echo "$raw" | python3 -c "
import sys, json, re

data = json.load(sys.stdin)
md = data.get('data',{}).get('markdown','')

# Extract content after nav
content = md
for pat in [r'Photo Gallery[^\n]*\n', r'\[Photo Gallery\][^\n]*\n']:
    m = re.search(pat, content, re.IGNORECASE)
    if m:
        content = content[m.end():]
        break

# Remove footer
for pat in [r'Powered by', r'©.*All Rights Reserved']:
    m = re.search(pat, content, re.IGNORECASE)
    if m:
        content = content[:m.start()]
        break

content = content.strip()

# Extract image URLs
imgs = re.findall(r'https?://(?:www\.)?lqplake\.org/uploads/[^\s\)\"]+', md)
rel = re.findall(r'(?<!\w)/uploads/[^\s\)\"]+', md)
for r in rel:
    full = 'http://www.lqplake.org' + r
    if full not in imgs:
        imgs.append(full)
seen = set()
unique = []
for u in imgs:
    if u not in seen:
        seen.add(u)
        unique.append(u)

print('CONTENT_START')
print(content)
print('CONTENT_END')
print('IMAGES_START')
for u in unique:
    print(u)
print('IMAGES_END')
print(f'STATS:{len(content)}:{len(unique)}')
" > "/tmp/scrape_result_$fname.txt" 2>/dev/null

    # Parse output
    local content=$(sed -n '/^CONTENT_START$/,/^CONTENT_END$/p' "/tmp/scrape_result_$fname.txt" | sed '1d;$d')
    local images=$(sed -n '/^IMAGES_START$/,/^IMAGES_END$/p' "/tmp/scrape_result_$fname.txt" | sed '1d;$d')
    local stats=$(grep "^STATS:" "/tmp/scrape_result_$fname.txt")

    echo "$content" > "$outdir/$fname.md"
    echo "$images" > "$outdir/$fname-images.txt"

    local nimgs=$(echo "$stats" | cut -d: -f3)
    local nchars=$(echo "$stats" | cut -d: -f2)
    echo "  OK - ${nchars} chars, ${nimgs} images"

    TOTAL_IMAGES=$((TOTAL_IMAGES + nimgs))
    TOTAL_PAGES=$((TOTAL_PAGES + 1))

    rm -f "/tmp/scrape_result_$fname.txt"
    sleep 1
}

echo "============================================================"
echo "LQP Lake Content Scraper"
echo "============================================================"

# Tournament pages
for url in \
    "http://www.lqplake.org/46th-annual-2026-rosterresults.html" \
    "http://www.lqplake.org/45th-annual-2025-rosterresults.html" \
    "http://www.lqplake.org/44th-annual-2024-rosterresults.html" \
    "http://www.lqplake.org/43rd-annual-2023-rosterresults.html" \
    "http://www.lqplake.org/42nd-annual-2022-rosterresults.html" \
    "http://www.lqplake.org/41st-annual-2021-rosterresults.html" \
    "http://www.lqplake.org/41st-annual-2020-rosterresults.html" \
    "http://www.lqplake.org/40th-annual-2019-rosterresults.html" \
    "http://www.lqplake.org/39th-annual-2018-rosterresults.html" \
    "http://www.lqplake.org/38th-annual-2017-rosterresults.html" \
    "http://www.lqplake.org/37-th-annual-2016-rosterresults.html" \
    "http://www.lqplake.org/36th-annual-2015-rosterresults.html" \
    "http://www.lqplake.org/35th-annual-2014-rosterresults.html" \
    "http://www.lqplake.org/34th-annual-2013.html" \
    "http://www.lqplake.org/33rd-annual-2012.html"; do
    fname=$(basename "$url" .html)
    scrape_page "$url" "$BASE/tournaments" "$fname"
done

echo ""

# League pages
for url in \
    "http://www.lqplake.org/lqp-fishing-league-2025.html" \
    "http://www.lqplake.org/lqp-fishing-league-2024.html" \
    "http://www.lqplake.org/lqp-fishing-league-2023.html" \
    "http://www.lqplake.org/lqp-fishing-league-2022.html" \
    "http://www.lqplake.org/lqp-fishing-league-2021.html" \
    "http://www.lqplake.org/lqp-fishing-league-2020.html" \
    "http://www.lqplake.org/lqp-fishing-league-2019.html" \
    "http://www.lqplake.org/lqp-fishing-league-2018.html" \
    "http://www.lqplake.org/lqp-fishing-league-2017.html" \
    "http://www.lqplake.org/lqp-fishing-league-2016.html" \
    "http://www.lqplake.org/lqp-fishing-league-2015.html" \
    "http://www.lqplake.org/lqp-fishing-league-2014.html" \
    "http://www.lqplake.org/lqp-fishing-league-2013.html"; do
    fname=$(basename "$url" .html)
    scrape_page "$url" "$BASE/league" "$fname"
done

echo ""
echo "============================================================"
echo "SUMMARY"
echo "============================================================"
echo "Total pages scraped: $TOTAL_PAGES / 28"
echo "Total image URLs found: $TOTAL_IMAGES"
