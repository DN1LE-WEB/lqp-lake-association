import json, re, sys, requests

FC_KEY = "fc-641516873ff14cf7bf281cb799e043e0"

resp = requests.post(
    "https://api.firecrawl.dev/v1/scrape",
    headers={"Content-Type": "application/json", "Authorization": f"Bearer {FC_KEY}"},
    json={"url": "http://www.lqplake.org", "formats": ["html"]}
)

data = resp.json()
if data.get("success"):
    html = data["data"]["html"]
    # Find ALL image references
    patterns = [
        r'src=["\']([^"\']+\.(jpg|jpeg|png|gif|webp))',
        r'url\(["\']?([^"\')\s]+\.(jpg|jpeg|png|gif|webp))',
        r'background[^:]*:\s*url\(["\']?([^"\')\s]+)',
        r'data-bg=["\']([^"\']+)',
        r'srcset=["\']([^"\']+)',
    ]
    all_urls = set()
    for pat in patterns:
        matches = re.findall(pat, html, re.I)
        for m in matches:
            url = m[0] if isinstance(m, tuple) else m
            all_urls.add(url)

    # Also check for weebly header/banner specific patterns
    header_matches = re.findall(r'header[^>]*style=["\'][^"\']*url\(([^)]+)\)', html, re.I)
    banner_matches = re.findall(r'banner[^>]*(?:src|style)[^>]*(?:url\()?["\']?([^"\')\s>]+\.(?:jpg|png))', html, re.I)

    print("=== ALL IMAGE URLS ===")
    for u in sorted(all_urls):
        print(u)

    if header_matches:
        print("\n=== HEADER IMAGES ===")
        for h in header_matches:
            print(h)

    if banner_matches:
        print("\n=== BANNER IMAGES ===")
        for b in banner_matches:
            print(b)

    # Check for any large hero/header wrapper
    hero_section = re.findall(r'<div[^>]*(?:hero|header|banner|splash)[^>]*>.*?</div>', html[:20000], re.I | re.DOTALL)
    if hero_section:
        print(f"\n=== HERO SECTIONS FOUND: {len(hero_section)} ===")
        for h in hero_section[:3]:
            print(h[:500])

    # Look for Weebly specific header image pattern
    wbanner = re.findall(r'wsite-header[^>]*>.*?</div>', html[:20000], re.I | re.DOTALL)
    if wbanner:
        print(f"\n=== WEEBLY HEADER ===")
        for w in wbanner[:2]:
            print(w[:1000])
else:
    print("ERROR:", data.get("error"))
