#!/bin/bash
# Fetch content from lqplake.org using Firecrawl API
# Usage: bash run.sh

BASE="C:/Users/dn1le/Documents/lqp lake/scraped-content"
KEY="fc-641516873ff14cf7bf281cb799e043e0"
TOTAL_IMAGES=0
TOTAL_PAGES=0

do_page() {
    local url="$1"
    local outdir="$2"
    local fname=$(basename "$url" .html)

    echo "Fetching: $fname"

    local raw=$(curl -s -X POST "https://api.firecrawl.dev/v1/scrape" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $KEY" \
        -d "{\"url\":\"$url\",\"formats\":[\"markdown\"]}")

    # Use python to process
    echo "$raw" | python -c "
import sys, json, re
try:
    d = json.load(sys.stdin)
    if not d.get('success'):
        print('FAIL')
        sys.exit(0)
    md = d['data']['markdown']
    content = md
    for pat in [r'\[Photo Gallery\][^\n]*\n', r'Photo Gallery[^\n]*\n']:
        m = re.search(pat, content, re.IGNORECASE)
        if m:
            content = content[m.end():]
            break
    for pat in [r'Powered by', r'\u00a9']:
        m = re.search(pat, content, re.IGNORECASE)
        if m:
            content = content[:m.start()]
            break
    content = content.strip()
    imgs = list(dict.fromkeys(re.findall(r'https?://(?:www\.)?lqplake\.org/uploads/[^\s\)\"]+', md)))
    with open('$outdir/$fname.md', 'w', encoding='utf-8') as f:
        f.write(content)
    with open('$outdir/$fname-images.txt', 'w', encoding='utf-8') as f:
        for u in imgs:
            f.write(u + '\n')
    print(f'OK:{len(content)}:{len(imgs)}')
except Exception as e:
    print(f'ERR:{e}')
" 2>/dev/null

    sleep 1
}

echo "============================================"
echo "LQP Lake Content Fetcher"
echo "============================================"

# Tournament pages
URLS_T=(
    "http://www.lqplake.org/46th-annual-2026-rosterresults.html"
    "http://www.lqplake.org/45th-annual-2025-rosterresults.html"
    "http://www.lqplake.org/44th-annual-2024-rosterresults.html"
    "http://www.lqplake.org/43rd-annual-2023-rosterresults.html"
    "http://www.lqplake.org/42nd-annual-2022-rosterresults.html"
    "http://www.lqplake.org/41st-annual-2021-rosterresults.html"
    "http://www.lqplake.org/41st-annual-2020-rosterresults.html"
    "http://www.lqplake.org/40th-annual-2019-rosterresults.html"
    "http://www.lqplake.org/39th-annual-2018-rosterresults.html"
    "http://www.lqplake.org/38th-annual-2017-rosterresults.html"
    "http://www.lqplake.org/37-th-annual-2016-rosterresults.html"
    "http://www.lqplake.org/36th-annual-2015-rosterresults.html"
    "http://www.lqplake.org/35th-annual-2014-rosterresults.html"
    "http://www.lqplake.org/34th-annual-2013.html"
    "http://www.lqplake.org/33rd-annual-2012.html"
)

for url in "${URLS_T[@]}"; do
    do_page "$url" "$BASE/tournaments"
done

echo ""

# League pages
URLS_L=(
    "http://www.lqplake.org/lqp-fishing-league-2025.html"
    "http://www.lqplake.org/lqp-fishing-league-2024.html"
    "http://www.lqplake.org/lqp-fishing-league-2023.html"
    "http://www.lqplake.org/lqp-fishing-league-2022.html"
    "http://www.lqplake.org/lqp-fishing-league-2021.html"
    "http://www.lqplake.org/lqp-fishing-league-2020.html"
    "http://www.lqplake.org/lqp-fishing-league-2019.html"
    "http://www.lqplake.org/lqp-fishing-league-2018.html"
    "http://www.lqplake.org/lqp-fishing-league-2017.html"
    "http://www.lqplake.org/lqp-fishing-league-2016.html"
    "http://www.lqplake.org/lqp-fishing-league-2015.html"
    "http://www.lqplake.org/lqp-fishing-league-2014.html"
    "http://www.lqplake.org/lqp-fishing-league-2013.html"
)

for url in "${URLS_L[@]}"; do
    do_page "$url" "$BASE/league"
done

echo ""
echo "============================================"
echo "DONE - Check output in $BASE"
echo "============================================"
