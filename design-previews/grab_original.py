from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    page.goto("http://www.lqplake.org", wait_until="networkidle", timeout=30000)
    page.wait_for_timeout(3000)
    page.screenshot(
        path="C:/Users/dn1le/Documents/lqp lake/design-previews/original_site.png",
        full_page=True,
    )
    print("Screenshot saved")

    # Find header background image
    result = page.evaluate("""() => {
        const results = [];
        const all = document.querySelectorAll('*');
        for (const el of all) {
            const bg = window.getComputedStyle(el).backgroundImage;
            if (bg && bg !== 'none' && bg.includes('upload')) {
                results.push({
                    bg: bg,
                    tag: el.tagName,
                    id: el.id,
                    cls: el.className.toString().substring(0, 100)
                });
            }
        }
        // Also check the banner specifically
        const banner = document.querySelector('#banner');
        const header = document.querySelector('.wsite-header');
        return {
            found: results,
            bannerBg: banner ? window.getComputedStyle(banner).backgroundImage : 'no banner',
            headerBg: header ? window.getComputedStyle(header).backgroundImage : 'no header',
            bannerHeight: banner ? banner.offsetHeight : 0,
            headerHeight: header ? header.offsetHeight : 0,
        };
    }""")
    print("Banner BG:", result.get("bannerBg"))
    print("Header BG:", result.get("headerBg"))
    print("Banner height:", result.get("bannerHeight"))
    print("Header height:", result.get("headerHeight"))
    for item in result.get("found", []):
        print(f"  {item['tag']}#{item['id']}.{item['cls']}: {item['bg'][:200]}")

    browser.close()
