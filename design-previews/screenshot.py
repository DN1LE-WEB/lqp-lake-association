from playwright.sync_api import sync_playwright
import os

designs = ['lodge-editorial', 'northwoods-modern', 'prairie-heritage']
base = 'C:/Users/dn1le/Documents/lqp lake/design-previews'

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})

    for name in designs:
        path = os.path.join(base, f'{name}.html').replace('\\', '/')
        page.goto(f'file:///{path}')
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(500)
        page.screenshot(path=f'/tmp/design_{name}.png', full_page=True)
        print(f'Screenshot saved: {name}')

    browser.close()
