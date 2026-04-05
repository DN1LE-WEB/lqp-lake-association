import json, re, requests

FC_KEY = "fc-641516873ff14cf7bf281cb799e043e0"

resp = requests.post(
    "https://api.firecrawl.dev/v1/scrape",
    headers={"Content-Type": "application/json", "Authorization": f"Bearer {FC_KEY}"},
    json={"url": "http://www.lqplake.org", "formats": ["html"]}
)

data = resp.json()
if data.get("success"):
    html = data["data"]["html"]

    # Find the banner/header section and all CSS
    # Look for inline styles with background
    bg_styles = re.findall(r'style="[^"]*background[^"]*"', html)
    for s in bg_styles:
        if 'url' in s.lower() or 'image' in s.lower():
            print("BG STYLE:", s[:300])

    # Look for CSS with header background
    style_blocks = re.findall(r'<style[^>]*>(.*?)</style>', html, re.DOTALL)
    for i, block in enumerate(style_blocks):
        if 'header' in block.lower() or 'banner' in block.lower():
            # Extract bg image urls from this block
            header_rules = re.findall(r'(?:header|banner)[^{]*\{[^}]*background[^}]*\}', block, re.I | re.DOTALL)
            for rule in header_rules:
                print(f"\nCSS RULE {i}:", rule[:500])
            urls = re.findall(r'url\(["\']?([^"\')\s]+)', block)
            if urls:
                print(f"\nCSS BLOCK {i} URLs:", urls)

    # Also look for the image 8253248 which we missed
    if '8253248' in html:
        ctx = html[html.index('8253248')-200:html.index('8253248')+200]
        print("\n8253248 CONTEXT:", ctx)

    # Find any data attributes for header
    header_data = re.findall(r'data-(?:bg|image|src|background)[^=]*="([^"]+)"', html)
    if header_data:
        print("\nDATA ATTRS:", header_data)

    # Screenshot the actual page to see the header
    print("\n\nLet's just screenshot the original site...")
