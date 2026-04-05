import requests
import json
import re
import time
import os

with open(r"C:\Users\dn1le\Documents\lqp lake\.firecrawl_key") as _f:
    API_KEY = _f.read().strip()
BASE_DIR = r"C:\Users\dn1le\Documents\lqp lake\scraped-content"

TOURNAMENT_PAGES = [
    "http://www.lqplake.org/46th-annual-2026-rosterresults.html",
    "http://www.lqplake.org/45th-annual-2025-rosterresults.html",
    "http://www.lqplake.org/44th-annual-2024-rosterresults.html",
    "http://www.lqplake.org/43rd-annual-2023-rosterresults.html",
    "http://www.lqplake.org/42nd-annual-2022-rosterresults.html",
    "http://www.lqplake.org/41st-annual-2021-rosterresults.html",
    "http://www.lqplake.org/41st-annual-2020-rosterresults.html",
    "http://www.lqplake.org/40th-annual-2019-rosterresults.html",
    "http://www.lqplake.org/39th-annual-2018-rosterresults.html",
    "http://www.lqplake.org/38th-annual-2017-rosterresults.html",
    "http://www.lqplake.org/37-th-annual-2016-rosterresults.html",
    "http://www.lqplake.org/36th-annual-2015-rosterresults.html",
    "http://www.lqplake.org/35th-annual-2014-rosterresults.html",
    "http://www.lqplake.org/34th-annual-2013.html",
    "http://www.lqplake.org/33rd-annual-2012.html",
]

LEAGUE_PAGES = [
    "http://www.lqplake.org/lqp-fishing-league-2025.html",
    "http://www.lqplake.org/lqp-fishing-league-2024.html",
    "http://www.lqplake.org/lqp-fishing-league-2023.html",
    "http://www.lqplake.org/lqp-fishing-league-2022.html",
    "http://www.lqplake.org/lqp-fishing-league-2021.html",
    "http://www.lqplake.org/lqp-fishing-league-2020.html",
    "http://www.lqplake.org/lqp-fishing-league-2019.html",
    "http://www.lqplake.org/lqp-fishing-league-2018.html",
    "http://www.lqplake.org/lqp-fishing-league-2017.html",
    "http://www.lqplake.org/lqp-fishing-league-2016.html",
    "http://www.lqplake.org/lqp-fishing-league-2015.html",
    "http://www.lqplake.org/lqp-fishing-league-2014.html",
    "http://www.lqplake.org/lqp-fishing-league-2013.html",
]

FIRECRAWL_URL = "https://api.firecrawl.dev/v1/scrape"

def scrape_page(url):
    """Scrape a single page via Firecrawl API."""
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}"
    }
    payload = {
        "url": url,
        "formats": ["markdown"]
    }
    resp = requests.post(FIRECRAWL_URL, headers=headers, json=payload, timeout=60)
    resp.raise_for_status()
    data = resp.json()
    return data

def extract_content(markdown):
    """Extract content portion - skip navigation, stop before footer."""
    if not markdown:
        return markdown, []

    # Try to find content after navigation links
    # Common nav items: Home, About, Tournament, Fishing League, Photo Gallery
    patterns_start = [
        r'Photo Gallery[^\n]*\n',
        r'\[Photo Gallery\][^\n]*\n',
        r'Photo Gallery\s*\n',
    ]

    content = markdown
    for pat in patterns_start:
        match = re.search(pat, content, re.IGNORECASE)
        if match:
            content = content[match.end():]
            break

    # Remove footer
    patterns_end = [
        r'Powered by',
        r'©.*All Rights Reserved',
        r'Copyright',
    ]
    for pat in patterns_end:
        match = re.search(pat, content, re.IGNORECASE)
        if match:
            content = content[:match.start()]
            break

    content = content.strip()

    # Extract image URLs from the full markdown (uploads paths)
    image_urls = re.findall(r'https?://(?:www\.)?lqplake\.org/uploads/[^\s\)\"]+', markdown)
    # Also check for relative upload paths
    relative_imgs = re.findall(r'(?<!\w)/uploads/[^\s\)\"]+', markdown)
    for rel in relative_imgs:
        full = f"http://www.lqplake.org{rel}"
        if full not in image_urls:
            image_urls.append(full)

    # Deduplicate while preserving order
    seen = set()
    unique_urls = []
    for u in image_urls:
        if u not in seen:
            seen.add(u)
            unique_urls.append(u)

    return content, unique_urls

def filename_from_url(url):
    """Extract filename stem from URL."""
    return url.rstrip('/').split('/')[-1].replace('.html', '')

def process_pages(pages, category):
    """Process a list of pages for a given category (tournaments or league)."""
    out_dir = os.path.join(BASE_DIR, category)
    os.makedirs(out_dir, exist_ok=True)

    total_images = 0
    success = 0
    failed = []

    for i, url in enumerate(pages):
        fname = filename_from_url(url)
        print(f"[{category}] ({i+1}/{len(pages)}) Scraping: {fname}")

        try:
            data = scrape_page(url)

            if not data.get("success"):
                print(f"  WARNING: API returned success=false for {url}")
                print(f"  Response: {json.dumps(data, indent=2)[:500]}")
                failed.append(url)
                time.sleep(1)
                continue

            markdown = data.get("data", {}).get("markdown", "")

            if not markdown:
                print(f"  WARNING: No markdown content for {url}")
                failed.append(url)
                time.sleep(1)
                continue

            content, image_urls = extract_content(markdown)

            # Save markdown
            md_path = os.path.join(out_dir, f"{fname}.md")
            with open(md_path, "w", encoding="utf-8") as f:
                f.write(content)

            # Save image URLs
            img_path = os.path.join(out_dir, f"{fname}-images.txt")
            with open(img_path, "w", encoding="utf-8") as f:
                for img_url in image_urls:
                    f.write(img_url + "\n")

            total_images += len(image_urls)
            success += 1
            print(f"  OK - {len(content)} chars, {len(image_urls)} images")

        except Exception as e:
            print(f"  ERROR: {e}")
            failed.append(url)

        # Rate limit
        if i < len(pages) - 1:
            time.sleep(1)

    return success, total_images, failed

def main():
    print("=" * 60)
    print("LQP Lake Content Scraper")
    print("=" * 60)

    t_success, t_images, t_failed = process_pages(TOURNAMENT_PAGES, "tournaments")
    print()
    l_success, l_images, l_failed = process_pages(LEAGUE_PAGES, "league")

    print()
    print("=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Tournament pages scraped: {t_success}/{len(TOURNAMENT_PAGES)}")
    print(f"League pages scraped:     {l_success}/{len(LEAGUE_PAGES)}")
    print(f"Total pages scraped:      {t_success + l_success}/{len(TOURNAMENT_PAGES) + len(LEAGUE_PAGES)}")
    print(f"Total image URLs found:   {t_images + l_images}")

    if t_failed or l_failed:
        print(f"\nFailed pages:")
        for u in t_failed + l_failed:
            print(f"  - {u}")

if __name__ == "__main__":
    main()
